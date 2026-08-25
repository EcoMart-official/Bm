const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// add imports if missing
if (!code.includes('import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }')) {
  code = code.replace(
    "import { TooltipProvider } from '@/components/ui/tooltip';",
    "import { TooltipProvider } from '@/components/ui/tooltip';\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';"
  );
}

const targetRegex = /<div className="grid gap-4 sm:grid-cols-2">[\s\S]*?<\/label>\s*<\/div>\s*<label className="block text-xs font-bold">Currency[\s\S]*?<\/label>/;

const newSelects = `<div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold">Turnover (approx)
              <Select value={turnover} onValueChange={setTurnover}>
                <SelectTrigger className="mt-2 w-full border-input bg-transparent shadow-sm">
                  <SelectValue placeholder="Select turnover" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Under 1L">Under 1 Lakh</SelectItem>
                  <SelectItem value="1L - 10L">1 Lakh - 10 Lakhs</SelectItem>
                  <SelectItem value="10L - 50L">10 Lakhs - 50 Lakhs</SelectItem>
                  <SelectItem value="50L - 1Cr">50 Lakhs - 1 Crore</SelectItem>
                  <SelectItem value="1Cr+">1 Crore+</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="block text-xs font-bold">Employees
              <Select value={employees} onValueChange={setEmployees}>
                <SelectTrigger className="mt-2 w-full border-input bg-transparent shadow-sm">
                  <SelectValue placeholder="Select employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Just me (1)</SelectItem>
                  <SelectItem value="1-10">1 - 10</SelectItem>
                  <SelectItem value="11-50">11 - 50</SelectItem>
                  <SelectItem value="51-200">51 - 200</SelectItem>
                  <SelectItem value="200+">200+</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
          <label className="block text-xs font-bold">Currency
            <Select disabled value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="mt-2 w-full border-input bg-transparent shadow-sm disabled:opacity-50" data-testid="select-onboarding-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR — Indian Rupee</SelectItem>
              </SelectContent>
            </Select>
          </label>`;

if (targetRegex.test(code)) {
  code = code.replace(targetRegex, newSelects);
  
  // Update employees default from '1-10' to '1'
  code = code.replace(/const \[employees, setEmployees\] = useState\('1-10'\);/, "const [employees, setEmployees] = useState('1');");
  
  fs.writeFileSync(path, code);
  console.log('App.tsx patched successfully.');
} else {
  console.log('Could not find the target code to replace.');
}

