const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendVerificationEmail, sendWelcomeEmail } = require('../utils/emailUtils');


// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    const { name, email: rawEmail, password, avatar, otp } = req.body;
    const email = rawEmail?.toLowerCase();

    try {
        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Verify OTP
        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        const isExpired = Date.now() - otpRecord.createdAt.getTime() > 1 * 60 * 1000;
        if (isExpired) {
            return res.status(400).json({ message: 'Verification code has expired. Please click "Resend Code".' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // SLIIT email parsing (e.g., it21001234@my.sliit.lk)
        const registerNumber = email.split("@")[0].toUpperCase();
        const field = registerNumber.substring(0, 2);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "student",
            registerNumber,
            field,
            avatar: avatar || "/avatars/avatar1.png",
            isVerified: true
        });

        // Delete OTP after successful registration
        await OTP.deleteOne({ _id: otpRecord._id });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    const { email: rawEmail, password } = req.body;
    const email = rawEmail?.toLowerCase();

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                mustChangePassword: user.mustChangePassword,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

// @desc    Update user avatar
// @route   PUT /api/users/update-avatar
// @access  Private
const updateAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.avatar = req.body.avatar || user.avatar;
            const updatedUser = await user.save();
            res.json({
                message: "Avatar updated",
                avatar: updatedUser.avatar
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.bio = req.body.bio || user.bio;

            // Enforce expert avatar choices (expert1.png to expert9.png)
            if (user.role === 'expert') {
                const expertAvatarRegex = /^src\/assets\/images\/Avatars\/expert[1-9]\.png$/;
                if (req.body.avatar && expertAvatarRegex.test(req.body.avatar)) {
                    user.avatar = req.body.avatar;
                } else if (!user.avatar || !expertAvatarRegex.test(user.avatar)) {
                    // Default to expert1.png if current is invalid or not provided
                    user.avatar = 'src/assets/images/Avatars/expert1.png';
                }
            } else {
                user.avatar = req.body.avatar || user.avatar;
            }

            if (user.role === 'student') {
                user.academicInfo = {
                    year: req.body.year || user.academicInfo?.year,
                    semester: req.body.semester || user.academicInfo?.semester
                };
            }

            if (user.role === 'expert') {
                if (Array.isArray(req.body.professionalInfo)) {
                    user.professionalInfo = req.body.professionalInfo.map(info => ({
                        company: info.company || '',
                        jobTitle: info.jobTitle || '',
                        experienceYears: Math.max(0, parseInt(info.experienceYears) || 0)
                    }));
                } else {
                    // Fallback for single object if sent
                    user.professionalInfo = [{
                        company: req.body.company || '',
                        jobTitle: req.body.jobTitle || '',
                        experienceYears: Math.max(0, parseInt(req.body.experienceYears) || 0)
                    }];
                }
            }

            user.profileCompleted = true;

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                avatar: updatedUser.avatar,
                bio: updatedUser.bio,
                academicInfo: updatedUser.academicInfo,
                professionalInfo: updatedUser.professionalInfo,
                profileCompleted: updatedUser.profileCompleted,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users/all
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.field = req.body.field || user.field;
            user.role = req.body.role || user.role;

            if (req.body.academicInfo && user.role === 'student') {
                user.academicInfo = {
                    year: req.body.academicInfo.year || user.academicInfo?.year,
                    semester: req.body.academicInfo.semester || user.academicInfo?.semester
                };
            }

            if (req.body.realEmail && user.role === 'expert') {
                user.realEmail = req.body.realEmail;
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                realEmail: updatedUser.realEmail,
                role: updatedUser.role,
                field: updatedUser.field,
                academicInfo: updatedUser.academicInfo
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/users/role/:id
// @access  Private/Admin
const updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.role = req.body.role || user.role;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.role === 'admin') {
                return res.status(400).json({ message: 'Cannot delete admin user' });
            }
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle Batch Rep status
// @route   PUT /api/users/toggle-rep/:id
// @access  Private/Admin
const toggleRep = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.role !== 'student') {
                return res.status(400).json({ message: 'Only students can be batch representatives' });
            }
            user.isBatchRep = !user.isBatchRep;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                isBatchRep: updatedUser.isBatchRep
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper to get next available expert email
const getNextExpertEmail = async () => {
    // Find all users with the expert email pattern
    const experts = await User.find({ email: /^ept\d{3}@sliitplatform\.com$/ }, 'email');

    // Extract numerical IDs
    const existingIds = experts
        .map(e => {
            const match = e.email.match(/^ept(\d{3})@/);
            return match ? parseInt(match[1]) : null;
        })
        .filter(id => id !== null)
        .sort((a, b) => a - b);

    // Find the first gap
    let nextId = 1;
    for (const id of existingIds) {
        if (id === nextId) {
            nextId++;
        } else if (id > nextId) {
            break;
        }
    }

    const nextIdStr = nextId.toString().padStart(3, '0');
    return {
        email: `ept${nextIdStr}@sliitplatform.com`,
        id: nextId
    };
};

// @desc    Admin create user (Manual add Expert/Student)
// @route   POST /api/users/admin-create
// @access  Private/Admin
const getExpertCount = async (req, res) => {
    console.log('--- GET expert-count hit ---');
    try {
        const { id } = await getNextExpertEmail();
        // We return id - 1 so the frontend's (expertCount + 1) logic still works if not updated,
        // but it's better to update frontend too. For now, let's keep it compatible.
        // Actually, if we return the count as (nextId - 1), then (count + 1) == nextId.
        res.status(200).json({ count: id - 1 });
    } catch (error) {
        console.error('--- Error in getExpertCount ---:', error);
        res.status(500).json({ message: error.message });
    }
};

const adminCreateUser = async (req, res) => {
    const { name, email: rawEmail, realEmail: rawRealEmail, password, role, field, year, semester } = req.body;
    let emailToUse = rawEmail?.trim()?.toLowerCase();
    const realEmail = rawRealEmail?.trim()?.toLowerCase();

    try {
        // If expert, generate system email
        if (role === 'expert') {
            if (!realEmail) {
                return res.status(400).json({ message: 'Real personal email is required for experts' });
            }

            // Check for existing expert with this real personal email
            const realEmailExists = await User.findOne({ realEmail, role: 'expert' });
            if (realEmailExists) {
                return res.status(400).json({ message: 'An expert with this personal email already exists' });
            }

            const { email: generatedEmail } = await getNextExpertEmail();
            emailToUse = generatedEmail;
        } else {
            if (!emailToUse) {
                return res.status(400).json({ message: 'Email is required' });
            }
        }

        // Final safety check for emailToUse
        const finalEmail = emailToUse || (role === 'expert' ? `ept_temp_${Date.now()}@sliitplatform.com` : null);

        if (!finalEmail) {
            return res.status(400).json({ message: 'Could not resolve a valid email for this account' });
        }

        const userExists = await User.findOne({ email: finalEmail });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email: finalEmail,
            realEmail: role === 'expert' ? realEmail : undefined,
            password: hashedPassword,
            role: role || "student",
            field: field || "General",
            avatar: role === 'expert' ? 'src/assets/images/Avatars/expert1.png' : "/avatars/avatar1.png",
            academicInfo: role === 'student' ? { year, semester } : undefined,
            isVerified: true,
            profileCompleted: role === 'expert' ? false : true,
            mustChangePassword: role === 'expert' ? true : false
        });

        if (user) {
            // Send Welcome Email
            const recipientEmail = role === 'expert' ? realEmail : finalEmail;
            await sendWelcomeEmail(recipientEmail, name, password, user.role, finalEmail);

            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                realEmail: user.realEmail,
                role: user.role,
                academicInfo: user.academicInfo
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send OTP to email
// @route   POST /api/users/send-otp
// @access  Public
const sendOTP = async (req, res) => {
    const { email: rawEmail } = req.body;
    const email = rawEmail?.toLowerCase();
    console.log(`Received OTP request for email: ${email}`);

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    // SLIIT email validation
    const sliitEmailRegex = /@(my\.sliit\.lk|sliitplatform\.com)$/;
    if (!sliitEmailRegex.test(email)) {
        return res.status(400).json({ message: 'Please use a valid SLIIT email address' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to DB (upsert)
        await OTP.findOneAndUpdate(
            { email },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // Send email
        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            res.status(200).json({ message: 'Verification code sent to email' });
        } else {
            res.status(500).json({ message: 'Failed to send verification email' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP (Standalone check)
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    const { email: rawEmail, otp } = req.body;
    const email = rawEmail?.toLowerCase();

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and verification code are required' });
    }

    if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ message: 'Verification code must be 6 digits' });
    }

    console.log(`Attempting to verify OTP for ${email}. Submitted: ${otp}`);

    try {
        // Find the record and log it for debugging
        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord) {
            console.log(`No OTP record found for ${email}`);
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        console.log(`Found OTP record for ${email}. Stored code: ${otpRecord.otp}`);

        const isExpired = Date.now() - otpRecord.createdAt.getTime() > 1 * 60 * 1000;
        if (isExpired) {
            console.log(`OTP Expired for ${email}`);
            return res.status(400).json({ message: 'Verification code has expired. Please click "Resend Code".' });
        }

        if (otpRecord.otp !== otp.toString()) {
            console.log(`OTP Mismatch! Stored: ${otpRecord.otp}, Submitted: ${otp}`);
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        console.log(`OTP Verification Successful for ${email}`);
        res.status(200).json({ message: 'Verification successful' });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -realEmail');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    getUserById,
    updateAvatar,
    updateProfile,
    getAllUsers,
    updateUserRole,
    updateUser,
    deleteUser,
    sendOTP,
    verifyOTP,
    adminCreateUser,
    getExpertCount,
    toggleRep,
};
