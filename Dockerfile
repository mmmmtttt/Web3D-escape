# basic image
FROM node as builder
#进入image中的 /usr/src/app 
WORKDIR /usr/src/app

# 第一个点指的是 Dockerfile 所在目录。第二个点是image里的当前位置。
#相当于把在本地上的 Angular 复制到/usr/src/app。
COPY . .
RUN npm install
RUN npm run build --prod

FROM nginx
COPY --from=builder /usr/src/app/dist/escape-frontend /usr/share/nginx/html
LABEL maintainer="mengtong"
#替换nginx的配置项
COPY ./nginx-angular.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-default.conf /etc/nginx/nginx.conf
COPY ./nginx-mime.types   /etc/nginx/mime.types