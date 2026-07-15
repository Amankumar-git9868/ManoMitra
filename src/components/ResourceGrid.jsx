import { useState } from 'react'
import { BookOpenText, Compass, Languages } from 'lucide-react'

const resourceHubContent = {
  en: {
    title: 'Resource Hub',
    subtitle: 'Explore trusted self-help content for daily emotional support.',
    categories: [
      {
        title: 'Stress Management',
        accent: 'from-rose-100 to-orange-50',
        border: 'border-rose-200',
        tab: 'bg-rose-100 text-rose-800',
        videos: [
          { title: 'Box Breathing for Stress Relief', embedUrl: 'https://www.youtube.com/embed/tEmt1Znux58' },
          { title: '2-Minute Guided Reset', embedUrl: 'https://www.youtube.com/embed/SEfs5TJZ6Nk' },
        ],
        tips: [
          'Pause for 60 seconds and notice one thing you can control right now.',
          'Step away from the screen, stretch your shoulders, and sip some water.',
          'Break one big task into the smallest next action.',
        ],
      },
      {
        title: 'Sleep Improvement',
        accent: 'from-indigo-100 to-sky-50',
        border: 'border-indigo-200',
        tab: 'bg-indigo-100 text-indigo-800',
        videos: [
          { title: 'Wind Down Before Bed', embedUrl: 'https://www.youtube.com/embed/aEqlQvczMJQ' },
          { title: 'Relaxing Breathing for Sleep', embedUrl: 'https://www.youtube.com/embed/1vx8iUvfyCY' },
        ],
        tips: [
          'Try dimming lights and reducing phone use 30 minutes before sleep.',
          'Keep a simple bedtime routine so your body gets a predictable signal.',
          'If thoughts feel noisy, write tomorrow\'s tasks on paper and set them aside.',
        ],
      },
      {
        title: 'Anxiety Help',
        accent: 'from-emerald-100 to-teal-50',
        border: 'border-emerald-200',
        tab: 'bg-emerald-100 text-emerald-800',
        videos: [
          { title: 'Grounding Exercise for Anxiety', embedUrl: 'https://www.youtube.com/embed/30VMIEmA114' },
          { title: 'Gentle Support for Overthinking', embedUrl: 'https://www.youtube.com/embed/O-6f5wQXSu8' },
        ],
        tips: [
          'Name five things you can see, four you can touch, and three you can hear.',
          'Remind yourself: this feeling is real, but it will not stay at this peak forever.',
          'Reach out to a trusted friend or family member if you need company.',
        ],
      },
    ],
  },
  hi: {
    title: 'रिसोर्स हब',
    subtitle: 'रोज़मर्रा के भावनात्मक सहारे के लिए उपयोगी और भरोसेमंद सामग्री देखें।',
    categories: [
      {
        title: 'तनाव प्रबंधन',
        accent: 'from-rose-100 to-orange-50',
        border: 'border-rose-200',
        tab: 'bg-rose-100 text-rose-800',
        videos: [
          { title: 'तनाव कम करने के लिए बॉक्स ब्रीदिंग', embedUrl: 'https://www.youtube.com/embed/tEmt1Znux58' },
          { title: '2 मिनट का गाइडेड रीसेट', embedUrl: 'https://www.youtube.com/embed/SEfs5TJZ6Nk' },
        ],
        tips: [
          '60 सेकंड रुकें और देखें कि अभी कौन-सी एक चीज़ आपके नियंत्रण में है।',
          'स्क्रीन से थोड़ा हटें, कंधों को स्ट्रेच करें, और पानी पिएं।',
          'एक बड़े काम को सबसे छोटे अगले कदम में बांटें।',
        ],
      },
      {
        title: 'बेहतर नींद',
        accent: 'from-indigo-100 to-sky-50',
        border: 'border-indigo-200',
        tab: 'bg-indigo-100 text-indigo-800',
        videos: [
          { title: 'सोने से पहले मन शांत करना', embedUrl: 'https://www.youtube.com/embed/aEqlQvczMJQ' },
          { title: 'नींद के लिए रिलैक्सिंग ब्रीदिंग', embedUrl: 'https://www.youtube.com/embed/1vx8iUvfyCY' },
        ],
        tips: [
          'सोने से 30 मिनट पहले रोशनी कम करें और फोन का उपयोग घटाएं।',
          'एक सरल सोने की दिनचर्या रखें ताकि शरीर को नियमित संकेत मिले।',
          'अगर विचार बहुत तेज़ हों, तो कल के काम कागज़ पर लिखकर अलग रख दें।',
        ],
      },
      {
        title: 'एंग्जायटी सहायता',
        accent: 'from-emerald-100 to-teal-50',
        border: 'border-emerald-200',
        tab: 'bg-emerald-100 text-emerald-800',
        videos: [
          { title: 'एंग्जायटी के लिए ग्राउंडिंग एक्सरसाइज़', embedUrl: 'https://www.youtube.com/embed/30VMIEmA114' },
          { title: 'ओवरथिंकिंग के लिए सौम्य सहारा', embedUrl: 'https://www.youtube.com/embed/O-6f5wQXSu8' },
        ],
        tips: [
          '5 चीज़ें देखें, 4 छुएं, और 3 आवाज़ें सुनें।',
          'खुद को याद दिलाएं: यह भावना अभी तीव्र है, लेकिन हमेशा ऐसी नहीं रहेगी।',
          'ज़रूरत हो तो किसी भरोसेमंद दोस्त या परिवार के सदस्य से बात करें।',
        ],
      },
    ],
  },
}

export default function ResourceGrid({ searchQuery }) {
  const [resourceLanguage, setResourceLanguage] = useState('en')
  const [activeTab, setActiveTab] = useState(0)

  const resourceView = resourceHubContent[resourceLanguage]

  const normalizedSearch = (searchQuery || '').trim().toLowerCase()
  const filteredResourceCategories = resourceView.categories
    .map((category) => {
      if (!normalizedSearch) return category
      const categoryMatch = category.title.toLowerCase().includes(normalizedSearch)
      const matchedVideos = category.videos.filter((v) => v.title.toLowerCase().includes(normalizedSearch))
      const matchedTips = category.tips.filter((t) => t.toLowerCase().includes(normalizedSearch))
      if (categoryMatch || matchedVideos.length || matchedTips.length) {
        return {
          ...category,
          videos: categoryMatch ? category.videos : matchedVideos,
          tips: categoryMatch ? category.tips : matchedTips,
        }
      }
      return null
    })
    .filter(Boolean)

  // Clamp activeTab when filtering removes categories
  const safeTab = Math.min(activeTab, Math.max(filteredResourceCategories.length - 1, 0))
  const activeCategory = filteredResourceCategories[safeTab]

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{resourceView.title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{resourceView.subtitle}</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0">
          {[
            { key: 'en', label: 'English' },
            { key: 'hi', label: 'हिन्दी' },
          ].map((language) => (
            <button
              key={language.key}
              type="button"
              onClick={() => { setResourceLanguage(language.key); setActiveTab(0) }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                resourceLanguage === language.key
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Languages size={14} />
              {language.label}
            </button>
          ))}
        </div>
      </div>

      {filteredResourceCategories.length === 0 ? (
        <div className="p-10 text-center text-slate-500">
          No resource matches found for "{searchQuery}".
        </div>
      ) : (
        <>
          {/* Horizontal category tabs — scroll on mobile */}
          <div className="flex gap-2 px-5 pt-4 overflow-x-auto pb-1 scrollbar-none">
            {filteredResourceCategories.map((category, index) => (
              <button
                key={category.title}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold border transition-all shrink-0 ${
                  safeTab === index
                    ? `${category.tab} border-transparent shadow-sm`
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Compass size={14} />
                {category.title}
              </button>
            ))}
          </div>

          {/* Active category content */}
          {activeCategory && (
            <div className={`m-4 rounded-2xl border bg-gradient-to-br ${activeCategory.accent} ${activeCategory.border} p-5`}>
              {/* Videos — always 2 per row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeCategory.videos.map((video) => (
                  <div
                    key={video.title}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="aspect-video">
                      <iframe
                        className="h-full w-full"
                        src={video.embedUrl}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="p-3 border-t border-slate-100">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{video.title}</p>
                      <a
                        href={video.embedUrl.replace('/embed/', '/watch?v=')}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-emerald-600 hover:underline"
                      >
                        Open on YouTube ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Tips */}
              <div className="mt-4 rounded-2xl bg-white/90 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <BookOpenText size={16} className="text-emerald-700" />
                  <p className="text-sm font-bold text-slate-900">
                    {resourceLanguage === 'en' ? 'Quick Tips' : 'त्वरित सुझाव'}
                  </p>
                </div>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
                  {activeCategory.tips.map((tip) => (
                    <div
                      key={tip}
                      className="rounded-xl border border-slate-100 bg-white p-3 text-sm text-slate-700 leading-relaxed shadow-sm"
                    >
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  )
}
