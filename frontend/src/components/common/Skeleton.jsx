import React from 'react';

export const Skeleton = ({ className, ...props }) => (
  <div className={`animate-pulse bg-stripes-light border border-black ${className}`} {...props} />
);

export const SkeletonCard = () => (
  <div className="flex flex-col gap-2 w-full">
    <Skeleton className="w-full aspect-[3/4]" />
    <div className="flex justify-between items-start mt-2 gap-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/4" />
    </div>
    <Skeleton className="h-3 w-1/2 mt-1" />
  </div>
);

export const SkeletonCategoryCard = () => (
  <div className="flex flex-col w-full h-full border-2 border-black bg-white">
    <div className="w-full bg-white border-b-2 border-black p-4" style={{ height: 'clamp(160px, 28vw, 240px)' }}>
      <Skeleton className="w-full h-full" />
    </div>
    <div className="p-5 md:p-6 flex flex-col flex-1 gap-4 bg-white">
      <Skeleton className="h-8 w-3/4" />
      <div className="flex flex-col gap-2 mb-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="mt-auto pt-4 border-t-2 border-dashed border-neutral-300 flex justify-between items-center">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  </div>
);

export const SkeletonCollectionCard = () => (
  <div className="flex flex-col w-full h-full border-4 border-black bg-white">
    <div className="w-full h-64 border-b-4 border-black bg-white p-4">
      <Skeleton className="w-full h-full" />
    </div>
    <div className="p-6 flex flex-col gap-4">
      <Skeleton className="h-8 w-3/4" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-4 pt-4 border-t-4 border-black flex justify-between items-center">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/4" />
      </div>
    </div>
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-4 w-full border-b border-neutral-100">
    <Skeleton className="w-20 h-24 flex-shrink-0" />
    <div className="flex flex-col flex-1 gap-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <Skeleton className="h-4 w-16" />
  </div>
);

export const SkeletonDetail = () => (
  <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
    <div className="flex-1 w-full h-[60vh] lg:h-[80vh]">
      <Skeleton className="w-full h-full" />
    </div>
    <div className="flex-1 w-full max-w-xl flex flex-col gap-6 py-8">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-8 w-1/4" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="mt-8">
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  </div>
);
