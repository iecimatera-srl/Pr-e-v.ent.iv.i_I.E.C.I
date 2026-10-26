@echo off
set "F=%~dp0index.html"
start "" msedge --app="file:///%F%"
exit /b
