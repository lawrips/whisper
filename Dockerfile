FROM node:4-onbuild
EXPOSE 6969
EXPOSE 6970
EXPOSE 6971
CMD ["node", "server.js"]
