import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

// Generate metadata
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' });
  
  return {
    title: t('tagline'),
    description: t('subtitle'),
  };
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  // For client-side translations, we'd use useTranslations
  // But since this is a server component, we'll use the messages directly
  // In a real app, you'd fetch translations properly
  
  return (
    <div className="flex flex-col">
      {/* Section 1: Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-green-pale overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D5A27' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Floating leaves animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 bg-green-light rounded-full opacity-30 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          {/* Logo */}
          <div className="mb-8 animate-glow">
            <img
              src="/images/logo.png"
              alt="The Green Memoir"
              className="w-48 h-48 md:w-72 md:h-72 mx-auto object-contain"
            />
          </div>

          {/* Tagline */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-green-dark mb-4">
            Ký ức xanh của miền quê Việt Nam
          </h1>

          {/* Subtitle */}
          <p className="font-body text-lg md:text-xl text-brown-dark mb-8 max-w-2xl mx-auto">
            Game nông trại 2D với văn hóa Việt Nam
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/purchase" className="btn-primary text-lg">
              Mua Game — 49,000₫
            </Link>
            <a 
              href="#trailer" 
              className="btn-secondary text-lg"
            >
              Xem Trailer ▶
            </a>
          </div>

          {/* Platform info */}
          <p className="text-sm text-brown-dark/70">
            Hỗ trợ Windows 10/11 | Early Access
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-green-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Section 2: Trailer */}
      <section id="trailer" className="py-20 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Video container with wooden frame */}
            <div className="relative border-4 border-brown-dark bg-brown-light p-2">
              <div className="aspect-video bg-black">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/placeholder"
                  title="The Green Memoir Trailer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            
            {/* Description */}
            <p className="mt-6 text-center text-brown-dark text-lg">
              Trải nghiệm cuộc sống nông thôn Việt Nam qua góc nhìn pixel art đầy màu sắc. 
              Trồng trọt, chăn nuôi, và khám phá những câu chuyện ấm áp của miền quê.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Screenshots */}
      <section className="py-20 bg-green-pale">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl text-center text-green-dark mb-12">
            Hình Ảnh Game
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className="relative aspect-video border-4 border-brown-dark bg-brown-light overflow-hidden group"
              >
                <img
                  src={`/images/screenshot-${i}.png`}
                  alt={`Screenshot ${i}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Features */}
      <section id="features" className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl text-center text-green-dark mb-4">
            Tính Năng Nổi Bật
          </h2>
          <p className="text-center text-brown-dark mb-12 max-w-2xl mx-auto">
            Khám phá những điều đặc biệt làm nên The Green Memoir
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature cards */}
            {[
              { icon: '🌾', title: 'Trồng Trọt', desc: 'Trồng và chăm sóc cây trồng đặc trưng Việt Nam' },
              { icon: '🇻🇳', title: 'Văn Hóa VN', desc: 'Khám phá văn hóa và phong cảnh Việt Nam' },
              { icon: '👨‍🌾', title: 'Nhân Vật', desc: 'Hóa thân thành nông dân với trang phục truyền thống' },
              { icon: '🌅', title: 'Ngày Đêm', desc: 'Chu kỳ ngày đêm và thời tiết thay đổi' },
              { icon: '💰', title: 'Kinh Tế', desc: 'Xây dựng và phát triển nông trại thịnh vượng' },
              { icon: '☁️', title: 'Cloud Save', desc: 'Lưu tiến độ tự động trên đám mây' },
            ].map((feature, i) => (
              <div 
                key={i}
                className="card bg-white p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="font-heading text-xl text-green-dark mb-2">
                  {feature.title}
                </h3>
                <p className="text-brown-dark/80">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: System Requirements */}
      <section className="py-20 bg-cream-dark">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl text-center text-green-dark mb-12">
            Cấu Hình Yêu Cầu
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Minimum */}
            <div className="card bg-white p-6">
              <h3 className="font-heading text-2xl text-green-dark mb-4 text-center">
                Tối Thiểu
              </h3>
              <ul className="space-y-3 text-brown-dark">
                <li className="flex justify-between border-b border-border pb-2">
                  <span>OS</span>
                  <span className="font-medium">Windows 10 64-bit</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span>CPU</span>
                  <span className="font-medium">Intel Core i3-2100</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span>RAM</span>
                  <span className="font-medium">4 GB</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span>GPU</span>
                  <span className="font-medium">NVIDIA GTX 660</span>
                </li>
                <li className="flex justify-between">
                  <span>Storage</span>
                  <span className="font-medium">1 GB</span>
                </li>
              </ul>
            </div>

            {/* Recommended */}
            <div className="card bg-white p-6 border-green-main">
              <h3 className="font-heading text-2xl text-green-dark mb-4 text-center">
                Khuyến Nghị
              </h3>
              <ul className="space-y-3 text-brown-dark">
                <li className="flex justify-between border-b border-border pb-2">
                  <span>OS</span>
                  <span className="font-medium">Windows 11 64-bit</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span>CPU</span>
                  <span className="font-medium">Intel Core i5-6600</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span>RAM</span>
                  <span className="font-medium">8 GB</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span>GPU</span>
                  <span className="font-medium">NVIDIA GTX 1060</span>
                </li>
                <li className="flex justify-between">
                  <span>Storage</span>
                  <span className="font-medium">1 GB SSD</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Roadmap */}
      <section className="py-20 bg-green-pale">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl text-center text-green-dark mb-12">
            Lộ Trình Phát Triển
          </h2>

          <div className="relative max-w-3xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-green-main" />

            {/* Timeline items */}
            {[
              { date: 'Q1 2026', version: 'v0.1.0', title: 'Early Access Launch', status: 'done' },
              { date: 'Q2 2026', version: 'v0.2.0', title: 'New Crops & Animals', status: 'current' },
              { date: 'Q3 2026', version: 'v0.3.0', title: 'Multiplayer Co-op', status: 'planned' },
              { date: 'Q4 2026', version: 'v1.0.0', title: 'Full Release', status: 'planned' },
            ].map((item, i) => (
              <div 
                key={i}
                className={`relative flex items-center mb-8 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div className={`w-1/2 ${i % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                  <div className="inline-block card bg-white p-4">
                    <span className="text-sm text-green-main font-medium">{item.date}</span>
                    <h3 className="font-heading text-lg text-green-dark">{item.title}</h3>
                    <span className="text-xs text-brown-dark/60">{item.version}</span>
                  </div>
                </div>
                
                {/* Dot */}
                <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-2 border-brown-dark ${
                  item.status === 'done' ? 'bg-green-dark' : 
                  item.status === 'current' ? 'bg-green-main animate-pulse' : 'bg-cream'
                }`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: CTA */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="card bg-white max-w-2xl mx-auto p-8 text-center">
            <img
              src="/images/logo.png"
              alt="The Green Memoir"
              className="w-24 h-24 mx-auto mb-6"
            />
            <h2 className="font-display text-3xl text-green-dark mb-2">
              Sở Hữu Game Ngay
            </h2>
            <p className="text-4xl font-bold text-gold mb-6">
              49,000₫
            </p>
            <Link 
              href="/purchase" 
              className="btn-primary text-lg inline-block"
            >
              Mua Ngay
            </Link>
            <div className="mt-6 flex justify-center gap-6 text-sm text-brown-dark/70">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-main" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Thanh toán an toàn
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-main" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Cập nhật miễn phí
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}