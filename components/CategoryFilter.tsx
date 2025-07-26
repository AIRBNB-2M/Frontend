
'use client';

const categories = [
  { id: 'all', name: '전체', icon: 'ri-home-line' },
  { id: 'beachfront', name: '해변 바로 앞', icon: 'ri-sun-line' },
  { id: 'amazing-views', name: '멋진 전망', icon: 'ri-landscape-line' },
  { id: 'omg', name: 'OMG!', icon: 'ri-star-line' },
  { id: 'treehouses', name: '나무집', icon: 'ri-plant-line' },
  { id: 'design', name: '디자인', icon: 'ri-palette-line' },
  { id: 'arctic', name: '북극', icon: 'ri-snow-line' },
  { id: 'national-parks', name: '국립공원', icon: 'ri-forest-line' },
  { id: 'tiny-homes', name: '작은 집', icon: 'ri-building-2-line' },
  { id: 'cabins', name: '통나무집', icon: 'ri-home-2-line' },
  { id: 'lakefront', name: '호수 바로 앞', icon: 'ri-water-line' },
  { id: 'mansions', name: '저택', icon: 'ri-government-line' },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="flex items-center gap-8 py-4 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex flex-col items-center gap-2 min-w-fit px-2 py-2 transition-colors whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className={`${category.icon} w-6 h-6 flex items-center justify-center`}></i>
              <span className="text-xs font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
