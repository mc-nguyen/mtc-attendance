import * as XLSX from 'xlsx';

export const expectedHeaders = [
    "Tên Thánh", "Họ", "Tên Đệm", "Tên Gọi", "Ngày Sinh", "Ngành", "Email",
    "SĐT Cá Nhân", "SĐT Cha", "SĐT Mẹ", "Tên Cha", "Tên Mẹ"
];

export function normalizeImportedData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("File không có dữ liệu.");
    }
    const headerMap = {};
    Object.keys(data[0]).forEach(h => {
        headerMap[h.trim()] = h;
    });
    const missing = expectedHeaders.filter(h => !headerMap[h]);
    if (missing.length > 0) {
        throw new Error("Thiếu cột: " + missing.join(', '));
    }
    return data.map(row => {
        const obj = {};
        expectedHeaders.forEach(header => {
            let value = row[headerMap[header]] || '';
            if (header === "Ngày Sinh" && typeof value === "number") {
                const date = new Date(Math.round((value - 25569) * 86400 * 1000));
                value = date.toISOString().split('T')[0];
            }
            obj[header] = value;
        });
        return obj;
    });
}

export function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(header => header.trim());
    const results = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const values = [];
        let inQuotes = false;
        let currentValue = '';
        ;
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"' && (j === 0 || line[j - 1] !== '\\')) {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            results.push(row);
        }
    }
    return results;
}

export function handleImportExcel(file, onSuccess, onError) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            const normalized = normalizeImportedData(jsonData);
            onSuccess(normalized);
        } catch (error) {
            onError(error);
        }
    };
    reader.readAsArrayBuffer(file);
}

export function handleFileUpload(file, onSuccess, onError) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const csvData = parseCSV(e.target.result);
            const normalized = normalizeImportedData(csvData);
            onSuccess(normalized);
        } catch (error) {
            onError(error);
        }
    };
    reader.readAsText(file);
}