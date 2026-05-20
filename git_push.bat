@echo off
set GIT="C:\Program Files\Git\cmd\git.exe"
echo [*] Degisiklikler ekleniyor...
%GIT% add .
echo [*] Commit mesaji girin:
set /p MSG="Mesaj: "
%GIT% commit -m "%MSG%"
echo [*] GitHub'a gonderiliyor...
%GIT% push
echo.
echo [OK] Tamamlandi!
pause
