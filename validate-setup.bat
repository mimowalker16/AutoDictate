@echo off
REM ============================================
REM AutoDictate Configuration Validator
REM ============================================

echo 🔍 Validating AutoDictate Configuration...
echo.

cd /d "C:\Users\mouay\Projects\autonote\autonote"

echo ✅ Checking dependencies...
call npm list react-native-dotenv >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ react-native-dotenv installed
) else (
    echo    ❌ react-native-dotenv missing
    goto :error
)

echo ✅ Checking environment file...
if exist ".env" (
    echo    ✓ .env file found
    findstr /C:"SPEECHMATICS_API_KEY" .env >nul
    if %errorlevel% equ 0 (
        echo    ✓ Speechmatics key configured
    ) else (
        echo    ⚠️ Speechmatics key needs to be set
    )
    
    findstr /C:"GEMINI_API_KEY" .env >nul
    if %errorlevel% equ 0 (
        echo    ✓ Gemini key configured
    ) else (
        echo    ⚠️ Gemini key needs to be set
    )
) else (
    echo    ❌ .env file missing
    goto :error
)

echo ✅ Checking Expo setup...
call npx expo --version >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Expo CLI available
) else (
    echo    ❌ Expo CLI not available
    goto :error
)

echo.
echo 🎉 Configuration validation complete!
echo.
echo 📝 Next steps:
echo    1. Edit .env file with your actual API keys
echo    2. Run: npx expo login
echo    3. Run: npm start
echo.
goto :end

:error
echo.
echo ❌ Configuration incomplete. Please check the setup guide.
echo.

:end
pause