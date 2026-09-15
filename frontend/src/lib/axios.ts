import axios from 'axios';

import { env } from '@/lib/env';

/** Axios instance dùng chung cho toàn app. Các feature service sẽ import và gọi trực tiếp. */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});
