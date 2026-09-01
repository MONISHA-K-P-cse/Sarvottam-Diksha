import React from 'react';
import { getCourseThumbnailSrc, getCourseThemeColor, getClassThumbnail } from '../../utils/courseHelpers';

export default function CourseThumbnailCard({ title, category, code, grade, thumbnail, course }) {
  const c = course || { title, category, code, grade, thumbnail };
  const src = getCourseThumbnailSrc(c);
  const bgColor = getCourseThemeColor(c);
  const fallbackSrc = getClassThumbnail(c.title, c.category, c.grade);
  
  return (
    <div 
      className="w-full h-52 sm:h-56 select-none shadow-md rounded-2xl border border-white/20 overflow-hidden flex items-center justify-center relative"
      style={{ backgroundColor: bgColor }}
    >
      <img
        src={src}
        alt=""
        onError={(e) => {
          if (e.currentTarget.src !== fallbackSrc) {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackSrc;
          }
        }}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

