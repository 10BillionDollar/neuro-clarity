export default function CognitiveAssessmentDashboard() {
  const biomarkers = [
    {
      title: 'Frontal Theta / Beta Ratio',
      value: '2.35',
      status: 'Significantly Elevated',
      color: 'bg-purple-100 text-purple-700',
      description: 'Suggests inefficiency in attention & cognitive control',
    },
    {
      title: 'Memory Theta - Alpha Ratio',
      value: '1.82',
      status: 'Elevated',
      color: 'bg-green-100 text-green-700',
      description: 'Indicates stress on memory encoding & retrieval systems',
    },
    {
      title: 'Posterior Dominance Index',
      value: '0.72',
      status: 'High',
      color: 'bg-blue-100 text-blue-700',
      description: 'May reflect compensatory neural recruitment',
    },
    {
      title: 'Occipital Entropy',
      value: '0.48',
      status: 'Low',
      color: 'bg-orange-100 text-orange-700',
      description: 'Reduced neural variability in visual processing',
    },
  ]

  const recommendations = [
    'Comprehensive Neuropsychological Assessment',
    'Brain Imaging (MRI / PET as indicated)',
    'Neurology Consultation',
    'Movement Disorder Evaluation (if applicable)',
    'Longitudinal EEG & Cognitive Monitoring',
  ]

  const lifestyle = [
    'Optimize Sleep Hygiene',
    'Stress Management',
    'Regular Physical Activity',
    'Cognitive Enrichment',
    'Reduce Cognitive Overload',
  ]

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Cognitive & Neural Function Assessment
              </h1>
              <p className="text-blue-100 mt-2 text-lg">
                EEG-Based Biomarker Insights for Early Detection & Cognitive Wellness
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-sm">
              <div className="space-y-2">
                <div><span className="font-semibold">Patient ID:</span> XXXX-1234</div>
                <div><span className="font-semibold">Age/Gender:</span> 38 / Male</div>
                <div><span className="font-semibold">Date:</span> 20 May 2026</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Risk + Biomarkers */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Risk Card */}
            <div className="bg-gradient-to-br from-blue-950 to-blue-800 text-white rounded-3xl p-6 flex flex-col justify-center items-center shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-center">Overall Cognitive Risk</h2>

              <div className="relative w-52 h-52 rounded-full border-[18px] border-red-400 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold">72%</div>
                  <div className="text-red-200 mt-2 text-lg">High Risk</div>
                </div>
              </div>

              <p className="mt-6 text-center text-blue-100 text-sm leading-relaxed">
                Elevated compared to age-matched norms.
              </p>
            </div>

            {/* Biomarkers */}
            <div className="lg:col-span-3 bg-slate-50 rounded-3xl border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Key EEG Biomarker Highlights
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {biomarkers.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition"
                  >
                    <div className="text-sm font-medium text-slate-500 mb-3 min-h-[48px]">
                      {item.title}
                    </div>

                    <div className="text-4xl font-bold text-slate-800 mb-3">
                      {item.value}
                    </div>

                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${item.color}`}
                    >
                      {item.status}
                    </span>

                    <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clinical Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="1. Clinical Interpretation">
              <p className="text-slate-700 leading-relaxed">
                The patient’s elevated cognitive risk score, combined with significant frontal theta/beta ratio and memory theta-alpha imbalance, suggests altered neural regulation within regions responsible for executive functioning, attention, and cognitive control.
              </p>
              <p className="text-slate-700 leading-relaxed mt-4">
                These findings may indicate early functional dysregulation within frontal-prefrontal neural circuits associated with higher-order cognition.
              </p>
            </SectionCard>

            <SectionCard title="2. Dementia / Cognitive Decline Likelihood">
              <p className="text-slate-700 leading-relaxed">
                While not diagnostic of dementia at this stage, the biomarker profile suggests elevated risk for cognitive dysfunction or future decline compared to age-matched norms.
              </p>

              <div className="mt-5 bg-green-50 border border-green-200 rounded-2xl p-4 text-green-800 font-medium">
                Early identification enables proactive monitoring, lifestyle optimization, and improved long-term outcomes.
              </div>
            </SectionCard>
          </div>

          {/* Abnormalities + Followup */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="3. Key Neurophysiological Observations">
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-blue-900 text-lg">
                    Elevated Posterior Dominance Index
                  </h3>
                  <p className="text-slate-700 mt-2 leading-relaxed">
                    May represent compensatory neural recruitment to maintain functionality despite frontal inefficiencies.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-orange-700 text-lg">
                    Reduced Occipital Entropy
                  </h3>
                  <p className="text-slate-700 mt-2 leading-relaxed">
                    Lower neural variability may impact visual information processing, sensory integration, and cognitive adaptability.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="4. Recommended Clinical Follow-Up">
              <div className="space-y-3">
                {recommendations.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                      ✓
                    </div>
                    <div className="text-slate-700 font-medium">{item}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Lifestyle */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="5. Lifestyle & Preventive Recommendations">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {lifestyle.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center"
                  >
                    <div className="text-green-700 font-semibold text-sm leading-snug">
                      {item}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 bg-slate-50 rounded-2xl p-4 border border-slate-200 text-slate-700">
                These interventions may help support cognitive resilience, neural efficiency, and overall well-being.
              </div>
            </SectionCard>

            <SectionCard title="Mental Health Evaluation">
              <p className="text-slate-700 leading-relaxed">
                Anxiety, depression, chronic stress, and burnout can significantly influence cognitive performance and EEG biomarkers.
              </p>

              <div className="mt-5 bg-purple-50 border border-purple-200 rounded-2xl p-4 text-purple-800 font-medium">
                Early psychological support can improve outcomes and cognitive resilience.
              </div>
            </SectionCard>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-blue-950 to-blue-800 rounded-3xl p-6 text-white">
            <h3 className="text-xl font-bold mb-3">Clinical Note</h3>
            <p className="text-blue-100 leading-relaxed">
              These findings should be interpreted as supportive neurophysiological indicators and not as a standalone diagnosis. EEG-based cognitive biomarkers are most valuable when integrated with clinical history, behavioral symptoms, neuropsychological testing, and longitudinal follow-up.
            </p>

            <div className="mt-6 text-center text-blue-200 font-medium tracking-wide">
              Early Insight. Better Decisions. Healthier Tomorrow.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-5">
        {title}
      </h2>
      {children}
    </div>
  )
}
