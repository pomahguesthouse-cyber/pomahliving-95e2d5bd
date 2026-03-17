import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Proyek", href: "#proyek" },
  { label: "Layanan", href: "#layanan" },
  { label: "Proses", href: "#proses" },
  { label: "Tentang", href: "#tentang" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <a href="/" className="font-display text-xl tracking-tight text-foreground">
          pomah<span className="text-primary">living</span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#konsultasi"
            className="text-sm font-body font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-md hover:opacity-90 transition-all active:scale-[0.98]"
          >
            Konsultasi
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-foreground"
          aria-label="Menu"
        >
          {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background border-b border-border px-6 pb-6 pt-2"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#konsultasi"
              onClick={() => setOpen(false)}
              className="block mt-3 text-sm text-center font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-md"
            >
              Konsultasi
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
