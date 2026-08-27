@echo off
echo ========================================
echo   SellTrack - Quick Setup
echo ========================================
echo.
echo Step 1: Pushing code to GitHub...
echo (Browser login window will open - login as KamenSutariya007)
echo.
cd /d F:\PROJECT\Online
git push
echo.
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Code pushed!
) else (
    echo Push failed - try again after GitHub login
)
echo.
echo ========================================
echo Step 2: Vercel Environment Variable
echo ========================================
echo.
echo Open this link in browser:
echo https://vercel.com/selltack/selltrack/settings/environment-variables
echo.
echo Add this variable if not exists:
echo.
echo   Key:   ALLOWED_REGISTRATION_EMAIL
echo   Value: kamensutariya01@gmail.com
echo.
echo Then click REDEPLOY on Vercel.
echo.
echo ========================================
echo Step 3: Use the app
echo ========================================
echo.
echo Register: https://selltrack-psi.vercel.app/register
echo Email:    kamensutariya01@gmail.com
echo Password: min 8 characters
echo.
echo After register, verify email then login.
echo.
pause
