export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="text-2xl font-bold text-blue-600 tracking-tight">IELTS<span className="text-gray-900">Master</span></div>
        <div className="hidden md:flex space-x-8 font-medium">
          <a href="#" className="hover:text-blue-600 transition-colors">Listening</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Reading</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Writing</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Speaking</a>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <header className="py-20 px-6 md:px-12 max-w-6xl mx-auto text-center md:text-left flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900">
            Boost Your <span className="text-blue-600">IELTS Score</span> Effortlessly.
          </h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto md:mx-0 leading-relaxed">
            The all-in-one platform for your IELTS preparation. Interactive practice, AI-powered feedback, and real exam simulations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl">
              Start Free Trial
            </button>
            <button className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all">
              Watch Demo
            </button>
          </div>
        </div>
        <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
          <div className="relative w-80 h-80 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
            <div className="absolute w-64 h-64 bg-blue-200 rounded-full flex items-center justify-center">
              <div className="w-48 h-48 bg-blue-600 rounded-2xl rotate-12 flex items-center justify-center shadow-2xl">
                 <span className="text-white text-6xl font-black -rotate-12">8.5</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="bg-gray-50 py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Everything you need to succeed</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { title: "Listening", desc: "40+ full mock tests with high-quality audio recordings." },
              { title: "Reading", desc: "Interactive reading passages with instant feedback." },
              { title: "Writing", desc: "AI evaluation for your Task 1 and Task 2 essays." },
              { title: "Speaking", desc: "Practice with our virtual examiner using voice recognition." }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 text-blue-600 font-bold text-xl">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-gray-500">
          <div className="text-xl font-bold text-gray-900 mb-4 md:mb-0">IELTS Master</div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
            <a href="#" className="hover:text-blue-600">Contact Us</a>
          </div>
          <p className="mt-4 md:mt-0 text-sm">© 2026 IELTS Master. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
