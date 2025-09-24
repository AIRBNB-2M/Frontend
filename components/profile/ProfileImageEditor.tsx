import { Camera } from "lucide-react";

interface ProfileImageEditorProps {
  profileImage: string | null;
  name: string;
  isEditing: boolean;
  imagePreview: string | null;
  onImageChange: (file: File) => void;
  onRemoveImage: () => void;
}

export default function ProfileImageEditor({
  profileImage,
  name,
  isEditing,
  imagePreview,
  onImageChange,
  onRemoveImage,
}: ProfileImageEditorProps) {
  return (
    <div className="relative">
      <img
        src={
          imagePreview ||
          profileImage ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            name || "Guest"
          )}&background=random`
        }
        alt={name}
        className="w-32 h-32 rounded-full object-cover"
      />

      {isEditing && (
        <div className="absolute -bottom-2 -right-2 flex gap-2">
          <label className="w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 cursor-pointer shadow-md">
            <Camera size={14} className="text-gray-600" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files && onImageChange(e.target.files[0])
              }
              className="hidden"
            />
          </label>

          {(imagePreview || profileImage) && (
            <button
              onClick={onRemoveImage}
              className="w-8 h-8 bg-red-500 border-2 border-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
              title="이미지 제거"
            >
              <span className="text-white text-xs">✕</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
