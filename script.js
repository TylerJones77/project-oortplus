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
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Load PDF with pdf.js
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            let fullText = '';
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += `Page ${pageNum}: ${pageText}\n\n`;
            }

            // Extract sqft (basic regex; refine with sample PDF)
            const sqftMatch = fullText.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(sq\s*ft|SF|square\s*feet|total\s*area)/i);
            const sqft = sqftMatch ? parseFloat(sqftMatch[1].replace(/,/g, '')) : 0; // Default to 0 if not found
            const cost = sqft * 0.02;

            // Generate invoice HTML
            const currentDate = new Date().toLocaleDateString();
            invoiceOutput.innerHTML = `
                <p><strong>Date:</strong> ${currentDate}</p>
                <p><strong>Project Sq Ft:</strong> ${sqft.toLocaleString()} SF</p>
                <p><strong>Rate:</strong> $0.02 per SF</p>
                <p><strong>Total Cost:</strong> $${cost.toFixed(2)}</p>
                <p><strong>Calculation:</strong> ${sqft} SF × $0.02 = $${cost.toFixed(2)}</p>
            `;

            // Extract materials for takeoff (basic keyword search; expand based on sample)
            // This simulates your prompt: groups into sections, estimates quantities
            const materials = extractMaterials(fullText); // Function defined below
            takeoffOutput.innerHTML = generateTakeoffHTML(materials, currentDate, sqft);

        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Failed to process PDF. Check console for details.');
        }
    });
});

// Function to extract materials from text (placeholder logic; improve with sample)
function extractMaterials(text) {
    // Logical subsections from your prompt
    const sections = {
        Framing: [],
        Exterior: [],
        Interior: [],
        Roofing: []
    };

    // Basic regex patterns for materials (add more from prompt/PDF sample)
    const patterns = [
        { regex: /Strong-Tie\s*(\w+)[^.]*(?:\s*(\d+)\s*each)?/gi, section: 'Framing', unit: 'each' },
        { regex: /(\d+)\s*studs\s*\((\d+x\d+)\)/gi, section: 'Framing', unit: 'each' },
        { regex: /headers\s*(\d+x\d+)\s*(\d+\s*LF)/gi, section: 'Framing', unit: 'LF' },
        { regex: /windows\s*(\d+x\d+)\s*(\d+\s*each)/gi, section: 'Exterior', unit: 'each' },
        { regex: /doors\s*(\w+)\s*(\d+\s*each)/gi, section: 'Interior', unit: 'each' },
        // Add more: sill plates, OSB, drywall, roofing, etc.
        // For calculations: e.g., studs = wall length / spacing
        // Assume some defaults; refine with actual PDF parsing
    ];

    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(text)) !== null) {
            const desc = match[0].trim();
            const qty = match[1] ? parseInt(match[1]) : 1; // Default qty
            const lf = match[2] ? parseFloat(match[2]) : 0; // Linear feet if applicable
            sections[pattern.section].push({ desc, qty, lf, unit: pattern.unit, notes: '' });
        }
    });

    // Example calculation: if wall length found, calc studs (e.g., every 16")
    const wallMatch = text.match(/wall\s*length\s*(\d+)\s*ft/gi);
    if (wallMatch) {
        const wallLength = parseFloat(wallMatch[1]);
        const studQty = Math.ceil(wallLength / (16 / 12)) + 2; // +2 for ends; 16" spacing
        sections.Framing.push({ desc: 'Studs (calculated)', qty: studQty, lf: wallLength, unit: 'each', notes: '16" OC' });
    }

    return sections;
}

// Generate takeoff HTML based on your prompt's format
function generateTakeoffHTML(sections, date, sqft) {
    let html = `
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>From:</strong> Your Company, 123 Construction Ln, City, ST 12345 | contact@yourco.com</p>
        <p><strong>To:</strong> Client Name, Client Address | client@email.com</p>
        <p><strong>Project Details:</strong> Residential/Commercial Building, Total ${sqft.toLocaleString()} SF (based on PDF).</p>
    `;

    let grandTotalQty = 0;
    let grandTotalLF = 0;

    for (const [section, items] of Object.entries(sections)) {
        if (items.length === 0) continue;

        html += `<h3>${section}</h3><table><thead><tr><th>Description</th><th>Quantity</th><th>Linear Ft</th><th>Unit</th><th>Notes</th></tr></thead><tbody>`;

        let subtotalQty = 0;
        let subtotalLF = 0;

        items.forEach(item => {
            html += `<tr><td>${item.desc}</td><td>${item.qty}</td><td>${item.lf}</td><td>${item.unit}</td><td>${item.notes}</td></tr>`;
            subtotalQty += item.qty;
            subtotalLF += item.lf;
        });

        html += `</tbody><tfoot><tr><td><strong>Subtotal</strong></td><td>${subtotalQty}</td><td>${subtotalLF}</td><td></td><td></td></tr></tfoot></table>`;

        grandTotalQty += subtotalQty;
        grandTotalLF += subtotalLF;
    }

    html += `<h3>Grand Totals</h3><p>Total Quantity: ${grandTotalQty} | Total Linear Ft: ${grandTotalLF}</p>`;

    return html;
}
