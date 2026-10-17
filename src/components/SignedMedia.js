import React from 'react';
import { useSignedUrl } from '../utils/storageUrls';

// Drop-in <img>/<video> that loads Supabase Storage files through signed URLs
export const SignedImg = ({ src, alt = '', ...props }) => {
  const resolved = useSignedUrl(src);
  return <img src={resolved || undefined} alt={alt} {...props} />;
};

export const SignedVideo = ({ src, ...props }) => {
  const resolved = useSignedUrl(src);
  return <video src={resolved || undefined} {...props} />;
};
