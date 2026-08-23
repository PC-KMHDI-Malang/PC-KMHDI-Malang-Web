import { supabaseAdmin } from "@/lib/supabase";

export default async function EbooksUserPage() {
  const { data: ebooks, error } = await supabaseAdmin
    .from("Ebook")
    .select("*")
    .order("createdAt", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Koleksi E-Book</h1>
        <p className="text-slate-500 text-lg">Jelajahi berbagai literatur dan buku saku digital KMHDI Malang.</p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-red-600 rounded-full inline-block"></span>
            Semua E-Book
          </h2>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-semibold">{ebooks?.length || 0} Tersedia</span>
        </div>
        {error && <p className="text-red-500">Gagal mengambil data.</p>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {ebooks?.map((ebook) => (
            <div key={ebook.id} className="group relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="relative h-64 overflow-hidden bg-slate-200">
                <img src={ebook.coverImage} alt={ebook.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80"></div>
              </div>
              
              <div className="absolute bottom-0 left-0 w-full p-5 text-white">
                <h3 className="font-bold text-lg leading-tight mb-4 drop-shadow-md line-clamp-2">{ebook.title}</h3>
                <a 
                  href={ebook.driveLink} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="block w-full text-center bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 hover:border-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
                >
                  Baca Sekarang
                </a>
              </div>
            </div>
          ))}
          {ebooks?.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 mb-4 opacity-20">
                <svg fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg>
              </div>
              <p className="text-lg">Belum ada koleksi ebook saat ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
