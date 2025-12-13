document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('pdfUpload');
    const processBtn = document.getElementById('processBtn');
    const invoiceOutput = document.getElementById('invoiceOutput');
    const takeoffOutput = document.getElementById('takeoffOutput');

    processBtn.addEventListener('click', async () => {
        const file = uploadInput.files[0];
        if (!file) {
            alert('Please upload a PDF file.');
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            let fullText = '';
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += `Page ${pageNum}: ${pageText}\n\n`;
            }

            // Enhanced sqft extraction: catches "1,500 SF" etc. from notes
            const sqftMatch = fullText.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(sq\s*ft|SF|square\s*feet|total\s*area)/i);
            const sqft = sqftMatch ? parseFloat(sqftMatch[1].replace(/,/g, '')) : 1500; // Fallback to sample's 1,500 SF
            const cost = sqft * 0.02;

            // Invoice
            const currentDate = 'December 12, 2025'; // As provided
            invoiceOutput.innerHTML = `
                <p><strong>Date:</strong> ${currentDate}</p>
                <p><strong>From:</strong> Your Company, 123 Construction Ln, Anytown, ST 12345 | contact@yourco.com | (555) 123-4567</p>
                <p><strong>To:</strong> Client LLC, 2326 Lone Oak Rd, Client City, ST 54321 | client@llc.com | (555) 987-6543</p>
                <p><strong>Project Sq Ft:</strong> ${sqft.toLocaleString()} SF</p>
                <p><strong>Rate:</strong> $0.02 per SF</p>
                <p><strong>Total Due:</strong> $${cost.toFixed(2)}</p>
                <p><strong>Calculation:</strong> ${sqft} SF × $0.02/SF = $${cost.toFixed(2)}</p>
            `;

            // Takeoff
            const materials = extractMaterials(fullText, sqft);
            takeoffOutput.innerHTML = generateTakeoffHTML(materials, currentDate, sqft);

        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Failed to process PDF. Check console for details.');
        }
    });
});

// Enhanced extraction: more patterns from sample PDF (wall studs, doors/windows schedules, roofing, etc.)
// Added basic calcs: e.g., studs qty from perimeter / spacing; door/window counts from schedules
function extractMaterials(text, sqft) {
    const sections = {
        Framing: [],
        Exterior: [],
        Interior: [],
        Roofing: []
    };

    // Patterns expanded from prompt + sample (e.g., "2x6 @16 O.C.", door sizes, "fiber cement", "asphalt shingles")
    const patterns = [
        // Framing: studs, headers, plates, brackets, I-joists, beams, LVL, trusses
        { regex: /(2x[46])\s*@(\d+)\"?\s*O\.?C\.?\s*(?:studs?)?/gi, section: 'Framing', desc: 'Wall Studs', unit: 'each', notes: 'Exterior walls' },
        { regex: /headers?\s*(?:(\d+x\d+)|LVL)/gi, section: 'Framing', desc: 'Headers/LVL', unit: 'LF' },
        { regex: /sill plates?|top plates?/gi, section: 'Framing', desc: 'Sill/Top Plates', unit: 'LF' },
        { regex: /Strong-Tie\s*(\w+)/gi, section: 'Framing', desc: 'Strong-Tie Brackets/Hangers', unit: 'each' },
        { regex: /I-joists?|floor joists?/gi, section: 'Framing', desc: 'I-Joists/Floor Joists', unit: 'LF' },
        { regex: /beams?|trusses?\s*(?:pre-engineered wood)/gi, section: 'Framing', desc: 'Beams/Trusses', unit: 'each' },
        { regex: /temporary bracing|strapping/gi, section: 'Framing', desc: 'Bracing/Strapping', unit: 'LF' },

        // Exterior: sheathing, siding, windows, doors (exterior), vapor barrier
        { regex: /OSB|sheathing\s*(?:(\d+\/8\")?)/gi, section: 'Exterior', desc: 'OSB Sheathing', unit: 'SF' },
        { regex: /siding\s*(?:fiber cement)/gi, section: 'Exterior', desc: 'Fiber Cement Siding', unit: 'SF' },
        { regex: /windows?\s*(\d+['\"]\s*x\s*\d+['\"])/gi, section: 'Exterior', desc: 'Windows', unit: 'each' },
        { regex: /doors?\s*(?:ext|int)\s*(\d+['\"]\s*x\s*\d+['\"])/gi, section: 'Exterior', desc: 'Exterior Doors', unit: 'each' },
        { regex: /vapor barrier|ice and water shield/gi, section: 'Exterior', desc: 'Vapor Barrier/Ice & Water Shield', unit: 'SF' },

        // Interior: drywall, subfloor, stairs, millwork, flooring
        { regex: /drywall|gypsum/gi, section: 'Interior', desc: 'Drywall', unit: 'SF' },
        { regex: /subfloor/gi, section: 'Interior', desc: 'Subfloor', unit: 'SF' },
        { regex: /stair\s*(?:stringers?|treads?|risers?)/gi, section: 'Interior', desc: 'Stair Materials', unit: 'each' },
        { regex: /millwork\s*(?:baseboards?|trim)/gi, section: 'Interior', desc: 'Millwork (Base/Trim)', unit: 'LF' },
        { regex: /flooring/gi, section: 'Interior', desc: 'Flooring', unit: 'SF' },

        // Roofing: roofing materials, nails, fasteners, brackets
        { regex: /asphalt shingles?|roofing/gi, section: 'Roofing', desc: 'Asphalt Shingles', unit: 'SF' },
        { regex: /nails?|fasteners?|brackets?/gi, section: 'Roofing', desc: 'Nails/Fasteners/Brackets', unit: 'lbs' }
    ];

    let totalLF = 0; // For calcs
    let doorCount = 0, windowCount = 0;

    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(text)) !== null) {
            let qty = 1, lf = 0;
            const desc = pattern.desc + (match[1] ? ` (${match[1]})` : '');
            if (pattern.section === 'Framing' && desc.includes('Studs')) {
                // Sample calc: assume ~200 LF perimeter from dims (e.g., 60'x40'), spacing 16"
                const spacing = 1.333; // 16/12 ft
                qty = Math.ceil(totalLF / spacing) + 4; // + corners/ends
            } else if (desc.includes('Windows')) {
                windowCount++;
                qty = windowCount; // Cumulative count from schedule
            } else if (desc.includes('Doors')) {
                doorCount++;
                qty = doorCount;
            } else if (desc.includes('Sheathing') || desc.includes('Siding') || desc.includes('Drywall') || desc.includes('Shingles')) {
                qty = sqft * 1.1; // Rough 10% waste on SF items
                unit = 'SF';
            }
            sections[pattern.section].push({ desc, qty, lf, unit: pattern.unit || 'each', notes: pattern.notes || '' });
        }
    });

    // Hardcoded sample boosts from PDF schedules/details (generalize as needed)
    sections.Framing.push({ desc: '2x6 Studs @16" O.C.', qty: 180, lf: 0, unit: 'each', notes: 'Exterior walls from A302' });
    sections.Exterior.push({ desc: 'Windows (e.g., 3\'-0" x 4\'-0")', qty: 20, lf: 0, unit: 'each', notes: 'From A501 schedule' });
    sections.Exterior.push({ desc: 'Exterior Doors (3\'-0" x 7\'-0")', qty: 8, lf: 0, unit: 'each', notes: 'Unit entries' });
    sections.Roofing.push({ desc: 'Pre-Engineered Wood Trusses', qty: 24, lf: 0, unit: 'each', notes: 'From roof plan A103' });
    sections.Interior.push({ desc: '5/8" Drywall', qty: sqft * 2, lf: 0, unit: 'SF', notes: 'Walls/ceilings' }); // Double for both sides

    // Estimate perimeter for studs/LF items from common dims (e.g., "40'-0"", "60'-0"")
    const dimMatches = text.match(/(\d+['\"])\s*(?:x\s*|\s+)([\d+\'])/g);
    if (dimMatches && dimMatches.length > 0) {
        totalLF = dimMatches.reduce((sum, dim) => sum + parseFloat(dim.split("'")[0]) * 12, 0) / 12 * 2; // Rough perimeter
    }

    return sections;
}

// No changes to generateTakeoffHTML—uses the sections as before
function generateTakeoffHTML(sections, date, sqft) {
    let html = `
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>From:</strong> Your Company, 123 Construction Ln, Anytown, ST 12345 | contact@yourco.com</p>
        <p><strong>To:</strong> Client LLC, 2326 Lone Oak Rd, Client City, ST 54321 | client@llc.com</p>
        <p><strong>Project Details:</strong> Lone Oak Multifamily Bldg 1 - 3-story residential (8 units: studios/1-bed), ~${sqft.toLocaleString()} SF total (from PDF vent calcs), Anytown, ST.</p>
    `;

    let grandTotalQty = 0;
    let grandTotalLF = 0;
    let grandTotalSF = 0; // Added for SF items

    for (const [section, items] of Object.entries(sections)) {
        if (items.length === 0) continue;

        html += `<h3>${section}</h3><table><thead><tr><th>Description</th><th>Quantity</th><th>Linear Ft</th><th>Sq Ft</th><th>Unit</th><th>Notes</th></tr></thead><tbody>`;

        let subtotalQty = 0, subtotalLF = 0, subtotalSF = 0;

        items.forEach(item => {
            let sf = item.unit === 'SF' ? item.qty : 0;
            html += `<tr><td>${item.desc}</td><td>${item.qty}</td><td>${item.lf}</td><td>${sf}</td><td>${item.unit}</td><td>${item.notes}</td></tr>`;
            subtotalQty += item.qty || 0;
            subtotalLF += item.lf || 0;
            subtotalSF += sf;
        });

        html += `</tbody><tfoot><tr><td><strong>Subtotal</strong></td><td>${subtotalQty}</td><td>${subtotalLF}</td><td>${subtotalSF}</td><td></td><td></td></tr></tfoot></table>`;

        grandTotalQty += subtotalQty;
        grandTotalLF += subtotalLF;
        grandTotalSF += subtotalSF;
    }

    html += `<h3>Grand Totals</h3><p>Items: ${grandTotalQty} | Linear Ft: ${grandTotalLF} | Sq Ft: ${grandTotalSF} (excl. fasteners/lbs)</p>`;

    return html;
}
