const fs = require('fs');
const path = require('path');

const pagesDir = '/Users/eakhalaivan/Downloads/PMS-PharmaDesk/frontend/src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
    if (['MedicineMaster.jsx', 'DirectPharmacySales.jsx', 'PharmacyClearance.jsx', 'UserManagement.jsx'].includes(file)) {
        continue; // Already processed manually
    }

    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    let modified = false;

    // 1. Add import useDebounce if not present
    if (content.includes('const [searchTerm, setSearchTerm] = useState') && !content.includes('useDebounce')) {
        const importMatch = content.match(/import React.*?from 'react';/);
        if (importMatch) {
            content = content.replace(importMatch[0], importMatch[0] + "\nimport useDebounce from '../hooks/useDebounce';");
        } else {
            content = "import useDebounce from '../hooks/useDebounce';\n" + content;
        }
        modified = true;
    }

    // 2. Add debouncedSearch and useEffect for currentPage
    if (content.includes('const [searchTerm, setSearchTerm] = useState') && !content.includes('debouncedSearch = useDebounce')) {
        const hasSetCurrentPage = content.includes('setCurrentPage');
        let replacement = `const [searchTerm, setSearchTerm] = useState('');\n  const debouncedSearch = useDebounce(searchTerm, 300);`;
        if (hasSetCurrentPage) {
            replacement += `\n  React.useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);`;
        }
        content = content.replace(/const \[searchTerm, setSearchTerm\] = useState\((?:''|""|``)\);/g, replacement);
        modified = true;
    }

    // 3. Replace searchTerm with debouncedSearch in filters
    if (content.includes('debouncedSearch')) {
        // e.g. !searchTerm || 
        content = content.replace(/!searchTerm/g, '!debouncedSearch');
        // e.g. const s = searchTerm.toLowerCase()
        content = content.replace(/searchTerm\.toLowerCase\(\)/g, 'debouncedSearch.toLowerCase()');
        modified = true;
    }

    // 4. Add searchPlaceholder to ModuleFilterBar if missing
    if (content.includes('<ModuleFilterBar') && !content.includes('searchPlaceholder=')) {
        content = content.replace(/<ModuleFilterBar/g, '<ModuleFilterBar searchPlaceholder="Search..."');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
