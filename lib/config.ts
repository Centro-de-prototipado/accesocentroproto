const isClient = typeof window !== 'undefined';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || (isClient ? '' : 'http://localhost:4000');

