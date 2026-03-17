const categories = [
  {
    title: "Layanan",
    links: ["Desain Arsitektur", "Desain + Bangun", "Interior", "Renovasi"],
  },
  {
    title: "Tipe Lahan",
    links: ["Lebar 6m", "Lebar 8m", "Lebar 10m", "Lebar 12m+"],
  },
  {
    title: "Gaya",
    links: ["Modern", "Japandi", "Industrial", "Tropis"],
  },
  {
    title: "Perusahaan",
    links: ["Tentang", "Karir", "Blog", "Kontak"],
  },
];

const Footer = () => {
  return (
    <footer id="tentang" className="py-20 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-xl tracking-tight text-foreground">
              pomah<span className="text-primary">living</span>
            </span>
            <p className="mt-4 text-xs font-body text-muted-foreground leading-relaxed">
              Arsitektur yang berpusat pada cara Anda hidup.
            </p>
          </div>
          {categories.map((cat) => (
            <div key={cat.title}>
              <h4 className="text-xs font-body font-medium uppercase tracking-widest text-foreground mb-4">
                {cat.title}
              </h4>
              <ul className="space-y-2.5">
                {cat.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-body text-muted-foreground">
            © 2026 Pomah Living. Hak cipta dilindungi.
          </p>
          <div className="flex gap-6 text-xs font-body text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-foreground transition-colors">Syarat & Ketentuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
