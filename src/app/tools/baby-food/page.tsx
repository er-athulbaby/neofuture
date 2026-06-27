'use client'

import { useState } from 'react'
import { Utensils, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface FoodEntry {
  age: string
  introduce: string[]
  avoid: string[]
  tips: string
  textures: string
  allergens: string[]
}

const FOOD_CHART: FoodEntry[] = [
  {
    age: '6 Months',
    introduce: ['Rice water / kanji', 'Moong dal water', 'Vegetable purees (carrot, sweet potato, pumpkin)', 'Banana mash', 'Apple sauce (cooked & pureed)', 'Ragi porridge (thin)'],
    avoid: ['Honey', 'Cow\'s milk as main drink', 'Salt & sugar', 'Nuts', 'Egg whites', 'Fish / seafood'],
    tips: 'Start with single-ingredient purees. Wait 3–5 days between new foods to check for allergies.',
    textures: 'Smooth purees, very thin consistency',
    allergens: ['Introduce one allergen at a time', 'Watch for rash, vomiting, or breathing issues'],
  },
  {
    age: '7 Months',
    introduce: ['Dal khichdi (soft)', 'Cooked mashed vegetables', 'Oats porridge', 'Pear / peach puree', 'Paneer (mashed)', 'Curd (small amounts)'],
    avoid: ['Honey', 'Salt & sugar', 'Whole nuts', 'Grapes (choking hazard)', 'Cow\'s milk as main drink'],
    tips: 'Increase consistency gradually. Baby should be swallowing properly before thickening food.',
    textures: 'Smooth to slightly lumpy purees',
    allergens: ['Can introduce egg yolk', 'Watch for reactions'],
  },
  {
    age: '8 Months',
    introduce: ['Soft cooked finger foods', 'Idli / dosa (soft)', 'Mashed rice + dal', 'Boiled egg yolk', 'Soft fruits (mango, papaya)', 'Well-cooked chicken (mashed)', 'Tomatoes (cooked)'],
    avoid: ['Honey', 'Salt & sugar (minimal)', 'Raw vegetables', 'Whole nuts', 'Cow\'s milk as main drink'],
    tips: 'Baby can begin self-feeding with thick purees. Let them explore textures.',
    textures: 'Mashed, minced — soft finger foods',
    allergens: ['Introduce fish with caution', 'Common allergen: wheat, eggs, fish'],
  },
  {
    age: '9–10 Months',
    introduce: ['Soft chapati pieces', 'Rice with dal & ghee', 'Cheese (small cubes)', 'Soft-cooked beans (rajma, chana)', 'Well-cooked fish (boneless)', 'Soft-cooked pasta', 'Rava upma (soft)'],
    avoid: ['Honey', 'Whole nuts', 'Hard raw vegetables', 'Added salt', 'Large fish high in mercury'],
    tips: 'Encourage self-feeding. Offer a variety of vegetables and proteins.',
    textures: 'Soft chunks, mashed, small pieces',
    allergens: ['Peanuts can be introduced if no family allergy history', 'Consult doctor before introducing top allergens'],
  },
  {
    age: '11–12 Months',
    introduce: ['Family foods (low salt/sugar)', 'Curd rice', 'Poha', 'Parathas (soft)', 'Whole egg', 'Soft-cooked meat', 'Seasonal Indian fruits', 'Soups and stews'],
    avoid: ['Honey (until 1 year)', 'Added salt/sugar in excess', 'Spicy food', 'Junk food'],
    tips: 'Baby can eat most family foods. Focus on iron-rich foods (dal, meat, green leafy veg).',
    textures: 'Chopped, soft family textures',
    allergens: ['Most allergens can now be introduced', 'Honey safe after 12 months'],
  },
  {
    age: '12–18 Months',
    introduce: ['All family foods (modified)', 'Cow\'s milk as main drink (now OK)', 'Whole eggs', 'Nuts & seeds (finely ground)', 'Legumes', 'Iron-fortified cereals', 'Leafy greens (spinach, methi)'],
    avoid: ['Choking hazards: whole grapes, nuts, popcorn, raw carrots', 'High-sugar drinks', 'Tea / coffee', 'Salty processed foods'],
    tips: 'Offer 3 meals + 2 snacks. Cow\'s milk (150–200ml/day) can replace formula.',
    textures: 'Family textures, cut into small pieces',
    allergens: ['All major allergens introduced', 'Monitor for new reactions'],
  },
  {
    age: '18–24 Months',
    introduce: ['All family foods', 'Variety of grains (millet, oats)', 'Fermented foods (idli, dosa, curd)', 'Seeds (sunflower, pumpkin — finely ground)', 'Jaggery (in moderation)', 'Different cuisines', 'Raw fruits & soft vegetables'],
    avoid: ['Highly processed foods', 'High-sugar sweets', 'Fizzy drinks', 'Too much salt'],
    tips: 'Focus on variety and balanced nutrition. Don\'t force-feed; let baby self-regulate.',
    textures: 'Regular family textures',
    allergens: ['All major allergens should be established', 'Introduce new foods regularly'],
  },
]

const ageOptions = FOOD_CHART.map((f) => f.age)

export default function BabyFoodPage() {
  const [selectedAge, setSelectedAge] = useState<string | null>(null)
  const selected = FOOD_CHART.find((f) => f.age === selectedAge)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-neo-orange-light rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Utensils className="text-neo-orange" size={28} />
        </div>
        <h1 className="text-3xl font-bold text-brand-dark mb-2">Baby Food Chart</h1>
        <p className="text-brand-gray">Age-appropriate Indian foods from 6 months to 2 years</p>
      </div>

      {/* Age selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
        {ageOptions.map((age) => (
          <button key={age} onClick={() => setSelectedAge(age)}
            className={`border-2 rounded-xl py-2.5 px-2 text-sm font-medium transition-all text-center ${
              selectedAge === age ? 'border-neo-orange bg-neo-orange text-white' : 'border-gray-200 text-brand-dark hover:border-neo-orange'
            }`}>
            {age}
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-brand-dark border-b border-gray-100 pb-3">{selected.age} — What to Feed</h2>

          {/* Texture & Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-neo-orange-light rounded-xl p-4">
              <p className="text-xs font-semibold text-neo-orange uppercase tracking-wide mb-1">Texture</p>
              <p className="text-sm text-brand-dark">{selected.textures}</p>
            </div>
            <div className="bg-primary-light rounded-xl p-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Tip</p>
              <p className="text-sm text-brand-dark">{selected.tips}</p>
            </div>
          </div>

          {/* Introduce */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} className="text-success" />
              <h3 className="font-semibold text-brand-dark">Foods to Introduce</h3>
            </div>
            <ul className="space-y-2">
              {selected.introduce.map((food) => (
                <li key={food} className="flex items-start gap-2 text-sm text-brand-dark">
                  <span className="text-success mt-0.5">•</span>
                  {food}
                </li>
              ))}
            </ul>
          </div>

          {/* Avoid */}
          <div className="bg-white rounded-xl border border-red-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={18} className="text-danger" />
              <h3 className="font-semibold text-brand-dark">Foods to Avoid</h3>
            </div>
            <ul className="space-y-2">
              {selected.avoid.map((food) => (
                <li key={food} className="flex items-start gap-2 text-sm text-brand-dark">
                  <span className="text-danger mt-0.5">•</span>
                  {food}
                </li>
              ))}
            </ul>
          </div>

          {/* Allergens */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-warning" />
              <h3 className="font-semibold text-brand-dark text-sm">Allergen Notes</h3>
            </div>
            <ul className="space-y-1">
              {selected.allergens.map((note) => (
                <li key={note} className="text-sm text-brand-dark">• {note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!selectedAge && (
        <div className="text-center py-12 text-brand-gray">
          <Utensils size={40} className="mx-auto mb-3 opacity-30" />
          <p>Select your baby's age to see the food chart</p>
        </div>
      )}
    </div>
  )
}
