import { OFFICIAL_PARIKSHA_IMAGES, OFFICIAL_ABHYAAS_IMAGES } from './officialCourseImages.js';

export const getClassThumbnail = (title, category, grade) => {
  const fullText = `${title || ''} ${category || ''} ${grade || ''}`.toUpperCase();

  let classNum = '10';
  for (let g = 6; g <= 12; g++) {
    if (fullText.includes(`CLASS ${g}`) || fullText.includes(`CLASS-${g}`) || fullText.includes(`GRADE ${g}`)) {
      classNum = String(g);
      break;
    }
  }

  if (fullText.includes('PARIKSHA')) {
    return OFFICIAL_PARIKSHA_IMAGES[classNum] || OFFICIAL_PARIKSHA_IMAGES['10'];
  }
  return OFFICIAL_ABHYAAS_IMAGES[classNum] || OFFICIAL_ABHYAAS_IMAGES['10'];
};

export const getCourseThumbnailSrc = (course) => {
  if (!course) return OFFICIAL_ABHYAAS_IMAGES['10'];
  
  let thumb = course.thumbnail;
  if (thumb && typeof thumb === 'string' && thumb.trim() !== '' && !thumb.includes('unsplash.com') && !thumb.startsWith('/courses/class-') && !thumb.startsWith('/courses/pariksha-') && !thumb.startsWith('/courses/abhyaas-')) {
    thumb = thumb.trim();
    if (!thumb.startsWith('http') && !thumb.startsWith('data:') && !thumb.startsWith('/')) {
      thumb = '/' + thumb;
    }
    return thumb;
  }
  
  return getClassThumbnail(course.title, course.category, course.grade);
};

export const getCourseThemeColor = (course) => {
  const titleUpper = (course?.title || '').toUpperCase();
  const gradeUpper = (course?.grade || course?.category || '').toUpperCase();

  if (titleUpper.includes('ABHYAAS')) return '#fff7ed';
  if (titleUpper.includes('PARIKSHA')) return '#ecfdf5';
  if (titleUpper.includes('CLASS 6') || gradeUpper.includes('CLASS 6')) return '#f3e8ff';
  if (titleUpper.includes('CLASS 7') || gradeUpper.includes('CLASS 7')) return '#fff7ed';
  if (titleUpper.includes('CLASS 8') || gradeUpper.includes('CLASS 8')) return '#f0fdf4';
  if (titleUpper.includes('CLASS 9') || gradeUpper.includes('CLASS 9')) return '#fefce8';
  if (titleUpper.includes('CLASS 10') || gradeUpper.includes('CLASS 10')) return '#f0f9ff';
  if (titleUpper.includes('CLASS 11') || gradeUpper.includes('CLASS 11')) return '#fdf2f8';
  if (titleUpper.includes('CLASS 12') || gradeUpper.includes('CLASS 12')) return '#ecfdf5';
  return '#f0f9ff';
};
