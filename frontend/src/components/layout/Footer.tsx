export default function Footer() {
  return (
    <footer className="px-4 pb-8 pt-2 sm:px-8 sm:pb-10">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start justify-between gap-4 border-t-[3px] border-black pt-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xl font-black leading-none">AgroSense</p>
          <p className="mt-1 text-[10px] text-neutral-600">&copy; 2026 AgroSense. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Kebijakan Privasi', 'Ketentuan Layanan', 'Hubungi Kami', 'Aksesibilitas'].map((label) => (
            <a key={label} className="rounded-md border-2 border-black px-3 py-1 text-[10px] font-bold" href="#">
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
