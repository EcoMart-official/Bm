const fs = require('fs');
let code = fs.readFileSync('artifacts/commercial-billing/src/App.tsx', 'utf8');

const customDropdownCode = `
function CustomDropdown({ value, onChange, options, placeholder, disabled }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; placeholder?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <div className="relative mt-2">
      <button 
        type="button" 
        onClick={() => !disabled && setOpen(!open)} 
        disabled={disabled}
        className={\`input-shell flex min-h-10 w-full items-center justify-between px-3 text-sm font-normal shadow-sm \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
      >
        <span className={selectedLabel ? 'text-foreground' : 'text-muted-foreground'}>{selectedLabel || placeholder}</span>
        <ChevronDown size={14} className="opacity-50" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in zoom-in-95">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left"
              >
                {opt.label}
                {value === opt.value && (
                  <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
`;

if (!code.includes('function CustomDropdown')) {
  code = code.replace('function Logo() {', customDropdownCode + '\nfunction Logo() {');
}

const selectReplacement = `            <label className="block text-xs font-bold">Turnover (approx)
              <CustomDropdown 
                value={turnover} 
                onChange={setTurnover}
                placeholder="Select turnover"
                options={[
                  { label: "Under 1 Lakh", value: "Under 1L" },
                  { label: "1 Lakh", value: "1L" },
                  { label: "1 Lakh - 10 Lakhs", value: "1L - 10L" },
                  { label: "10 Lakhs - 50 Lakhs", value: "10L - 50L" },
                  { label: "50 Lakhs - 1 Crore", value: "50L - 1Cr" },
                  { label: "1 Crore+", value: "1Cr+" }
                ]}
              />
            </label>
            <label className="block text-xs font-bold">Employees
              <CustomDropdown 
                value={employees} 
                onChange={setEmployees}
                placeholder="Select employees"
                options={[
                  { label: "1 Employee", value: "1" },
                  { label: "2 - 10", value: "2-10" },
                  { label: "11 - 50", value: "11-50" },
                  { label: "51 - 200", value: "51-200" },
                  { label: "200+", value: "200+" }
                ]}
              />
            </label>
          </div>
          <label className="block text-xs font-bold">Currency
            <CustomDropdown 
              disabled 
              value={currency} 
              onChange={setCurrency}
              options={[{ label: "INR — Indian Rupee", value: "INR" }]}
            />
          </label>`;

// We will replace the <Select> parts in Onboarding with the custom ones.
// I'll do a regex or string replacement on Onboarding's specific grid container.

const searchString = `<label className="block text-xs font-bold">Turnover (approx)
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

code = code.replace(searchString, selectReplacement);

fs.writeFileSync('artifacts/commercial-billing/src/App.tsx', code);
