# 🔧 AutoDictate Complete Configuration Guide

## 📋 **Prerequisites** 
- Node.js installed (check with `node --version`)
- Git installed
- Internet connection

---

## 🔑 **Step 1: Get API Keys (FREE)**

### **Speechmatics API** (Speech-to-Text)
1. Go to [speechmatics.com](https://speechmatics.com)
2. Click "Get Started Free" 
3. Create account with email
4. Go to Dashboard → API Keys
5. Copy your API key
6. **Free tier**: 30 minutes of transcription per month

### **Google Gemini API** (AI Processing)  
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google account
3. Click "Get API key"
4. Create new API key
5. Copy the key
6. **Free tier**: Generous limits for personal use

---

## 📱 **Step 2: Expo Setup**

### **Create Expo Account**
1. Go to [expo.dev](https://expo.dev)
2. Sign up for free account
3. Or use existing Google/GitHub account

### **Login via CLI**
```bash
# Navigate to project
cd /c/Users/mouay/Projects/autonote/autonote

# Login to Expo
npx expo login
```

---

## ⚙️ **Step 3: Configure Environment**

### **Edit .env File**
Open `autonote/.env` and replace the placeholders:

```env
# Replace with your actual keys
SPEECHMATICS_API_KEY=sp_xxx_your_actual_key_here
GEMINI_API_KEY=AIzaSy_your_actual_key_here
```

### **Verify Configuration**
```bash
# Check if environment variables are working
cd /c/Users/mouay/Projects/autonote/autonote
npx expo start --clear
```

---

## 🚀 **Step 4: Development Server**

### **Start Development**
```bash
cd /c/Users/mouay/Projects/autonote/autonote
npm start
```

### **Testing Options**
- **Web**: Press `w` to open in browser
- **iOS**: Press `i` (requires iOS device or simulator)  
- **Android**: Press `a` (requires Android device or emulator)
- **Expo Go**: Scan QR code with Expo Go app on phone

---

## 📱 **Step 5: Testing on Phone** 

### **Install Expo Go App**
- Download "Expo Go" from App Store (iOS) or Google Play (Android)
- Open the app and scan QR code from terminal

### **Test Recording**
1. Allow microphone permissions
2. Tap record button
3. Speak for 10-15 seconds  
4. Stop recording
5. Wait for AI processing
6. Check if transcription and notes appear

---

## 🔧 **Troubleshooting**

### **Common Issues**

**"Network Error"**
- Check internet connection
- Verify API keys are correct
- Check if APIs have usage limits

**"Module not found"** 
```bash
cd /c/Users/mouay/Projects/autonote/autonote
npm install
npx expo install --fix
```

**"Environment variables not working"**
- Restart development server: `npx expo start --clear`
- Check .env file has no extra spaces
- Ensure .env is in autonote/ folder

**"Expo login issues"**
- Clear cache: `npx expo logout && npx expo login`
- Try browser login: `npx expo login --sso`

### **Check Configuration**
```bash
# Verify all dependencies
npm list react-native-dotenv

# Check Expo project  
npx expo whoami
npx expo doctor

# Test API keys (will show if keys are detected)
npx expo start --clear
```

---

## 🎯 **Production Setup** (Optional)

### **Build for Distribution**
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to EAS
eas login

# Configure build
eas build:configure

# Build APK (Android)
eas build --platform android --profile preview

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

---

## 📊 **API Usage Monitoring**

### **Speechmatics**
- Dashboard: [speechmatics.com/dashboard](https://speechmatics.com/dashboard)
- Check usage and remaining minutes

### **Google Gemini**  
- Console: [console.cloud.google.com](https://console.cloud.google.com)
- Monitor API quotas and usage

---

## 🔒 **Security Notes**

- ✅ `.env` file is in `.gitignore` (keys won't be committed)
- ✅ API keys are only used for processing
- ✅ All notes stored locally on device
- ⚠️ Never share your API keys publicly
- ⚠️ Regenerate keys if compromised

---

## 📞 **Support**

**Configuration Issues**: Check this guide first  
**App Development**: Contact the project maintainer  
**API Issues**: Check respective provider documentation  

**Ready to start? Run the setup script:**
```bash
chmod +x setup.sh
./setup.sh
```

🎉 **Happy coding!**