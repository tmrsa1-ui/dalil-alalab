# دليل الألعاب — صورة إنتاج لأي خادم يشغّل Docker (بديل Vercel).
# البناء يشغّل validate:data ويفشل لو البيانات ناقصة.
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build /app ./
USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
