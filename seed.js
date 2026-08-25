const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const hook = `
  const [seeding, setSeeding] = useState(false);
  useEffect(() => {
    if (!isProducts && table.data && table.data.length === 0 && !seeding) {
      setSeeding(true);
      const seedCustomers = async () => {
        const dummyCustomers = [
          { name: 'Arjun Das', email: 'arjun@example.com', phone: '09876543210', address: 'Kolkata, West Bengal' },
          { name: 'Riya Sen', email: 'riya@example.com', phone: '09876543211', address: 'Howrah, West Bengal' },
          { name: 'Sanjay Gupta', email: 'sanjay@example.com', phone: '09876543212', address: 'Durgapur, West Bengal' },
          { name: 'Priya Roy', email: 'priya@example.com', phone: '09876543213', address: 'Asansol, West Bengal' },
          { name: 'Vikram Singh', email: 'vikram@example.com', phone: '09876543214', address: 'Siliguri, West Bengal' },
          { name: 'Anjali Sharma', email: 'anjali@example.com', phone: '09876543215', address: 'Burdwan, West Bengal' },
          { name: 'Rahul Bose', email: 'rahul@example.com', phone: '09876543216', address: 'Malda, West Bengal' },
          { name: 'Kavita Mishra', email: 'kavita@example.com', phone: '09876543217', address: 'Kharagpur, West Bengal' },
          { name: 'Amit Patel', email: 'amit@example.com', phone: '09876543218', address: 'Haldia, West Bengal' },
          { name: 'Neha Chakraborty', email: 'neha@example.com', phone: '09876543219', address: 'Darjeeling, West Bengal' }
        ];
        
        try {
          for (const c of dummyCustomers) {
            await db.insert('customers', c);
          }
          await table.reload();
        } catch (e) {
          console.error("Seed failed:", e);
        }
      };
      
      // Auto-seed only once if empty
      seedCustomers();
    }
  }, [table.data, isProducts, seeding]);
`;

code = code.replace(
  "const open = (row?: Row) => { setEditing(row || null); setForm(row ? { ...row } : {}); setModal(true); };",
  hook + "\n  const open = (row?: Row) => { setEditing(row || null); setForm(row ? { ...row } : {}); setModal(true); };"
);

fs.writeFileSync(path, code);
