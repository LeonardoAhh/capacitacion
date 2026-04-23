'use client';

import { useRouter } from 'next/navigation';
import SlideEditorV2 from '@/components/features/Courses/SlidePlayerV2/SlideEditorV2';
import {
  getCourseWithSlides,
  updateSlide,
  addSlide,
  deleteSlide,
  updateSlidesOrder,
  updateCourseFields,
} from '@/lib/courseService';

export default function EditorV2Page({ params }) {
  const { id: courseId } = params;
  const router = useRouter();

  const handleSyncMetadata = (cId, count) => {
    const estMins = Math.max(5, Math.ceil((count * 3) / 5) * 5);
    updateCourseFields(cId, { slideCount: count, duration: `${estMins} min` }).catch(console.error);
  };

  return (
    <div>
      <SlideEditorV2
        courseId={courseId}
        loadCourse={getCourseWithSlides}
        saveSlideFn={updateSlide}
        addSlideFn={addSlide}
        deleteSlideFn={deleteSlide}
        reorderSlidesFn={updateSlidesOrder}
        syncMetadataFn={handleSyncMetadata}
        onClose={() => router.push('/induccion')}
      />
    </div>
  );
}
