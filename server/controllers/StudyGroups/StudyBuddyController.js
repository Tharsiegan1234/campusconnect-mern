const { BuddyNotification, WeeklySummary, MaterialTag } = require('../../models/StudyGroups/StudyBuddy');
const StudyGroup = require('../../models/StudyGroups/StudyGroups');
const User = require('../../models/User');

// Auto-welcome when user joins group
exports.autoWelcome = async (userId, groupId) => {
  try {
    const user = await User.findById(userId);
    const group = await StudyGroup.findById(groupId);
    
    if (!user || !group) return;
    
    const sessionCount = group.sessions?.length || 0;
    const memberCount = group.members?.length || 0;
    const materialCount = group.materials?.length || 0;
    
    const welcomeMessages = [
      `🎉 Welcome ${user.name}! Great to have you! This group has ${sessionCount} sessions scheduled.`,
      `🎉 Welcome ${user.name}! You're the ${memberCount}th member. Ready to study?`,
      `🎉 Welcome ${user.name}! Check out the materials section—${materialCount} resources available!`
    ];
    
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    
    const notification = new BuddyNotification({
      groupId: groupId,
      type: 'welcome',
      message: randomMessage,
      metadata: { userId, userName: user.name }
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Auto-welcome error:', error);
  }
};

// Get all buddy notifications for a group
exports.getBuddyNotifications = async (req, res) => {
  try {
    const { groupId } = req.params;
    const notifications = await BuddyNotification.find({ groupId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Auto-tag materials
exports.autoTagMaterial = async (materialId, groupId, title, description) => {
  try {
    const tags = [];
    const lowerTitle = title.toLowerCase();
    const lowerDesc = (description || '').toLowerCase();
    
    if (lowerTitle.includes('exam') || lowerTitle.includes('test') || 
        lowerTitle.includes('midterm') || lowerTitle.includes('final')) {
      tags.push('📝 Exam Prep');
    }
    
    if (lowerTitle.includes('note') || lowerTitle.includes('summary') || 
        lowerDesc.includes('summary')) {
      tags.push('📘 Notes');
    }
    
    if (lowerTitle.includes('practice') || lowerTitle.includes('problem') || 
        lowerTitle.includes('exercise') || lowerTitle.includes('assignment')) {
      tags.push('✏️ Practice');
    }
    
    if (lowerTitle.includes('lecture') || lowerTitle.includes('slide') || 
        lowerTitle.includes('presentation')) {
      tags.push('🎓 Lecture');
    }
    
    if (lowerTitle.includes('reference') || lowerTitle.includes('guide') || 
        lowerTitle.includes('tutorial')) {
      tags.push('📚 Reference');
    }
    
    if (tags.length === 0) {
      tags.push('📄 General');
    }
    
    const tagDoc = new MaterialTag({
      materialId,
      groupId,
      tags
    });
    
    await tagDoc.save();
    return tagDoc;
  } catch (error) {
    console.error('Auto-tag error:', error);
  }
};

// Get materials with auto-tags for a group
exports.getMaterialsWithTags = async (req, res) => {
  try {
    const { groupId } = req.params;
    const tags = await MaterialTag.find({ groupId })
      .populate('materialId')
      .sort({ createdAt: -1 });
    
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get weekly summary stats
exports.getWeeklySummary = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const group = await StudyGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const totalSessions = group.sessions?.filter(s => new Date(s.date) >= lastWeek).length || 0;
    
    const newMembers = group.members?.filter(m => 
      new Date(m.joinedAt) >= lastWeek
    ).length || 0;
    
    const newMaterials = group.materials?.filter(m => 
      new Date(m.createdAt) >= lastWeek
    ).length || 0;
    
    const activeMembers = group.members?.filter(m => 
      m.lastActive && new Date(m.lastActive) >= lastWeek
    ).length || 0;
    
    res.json({
      totalSessions,
      newMembers,
      newMaterials,
      activeMembers,
      weekStart: lastWeek,
      weekEnd: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get upcoming session reminders (next 24 hours)
exports.getUpcomingSessions = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await StudyGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const upcomingSessions = group.sessions?.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate > now && sessionDate <= next24Hours;
    }).map(session => ({
      ...session.toObject(),
      hoursUntil: Math.ceil((new Date(session.date) - now) / (1000 * 60 * 60))
    })) || [];
    
    res.json(upcomingSessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create weekly summary (to be called by cron job)
exports.createWeeklySummary = async (groupId) => {
  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const group = await StudyGroup.findById(groupId);
    
    const stats = {
      totalSessions: group.sessions?.filter(s => new Date(s.date) >= lastWeek).length || 0,
      newMembers: group.members?.filter(m => new Date(m.joinedAt) >= lastWeek).length || 0,
      newMaterials: group.materials?.filter(m => new Date(m.createdAt) >= lastWeek).length || 0,
      activeMembers: group.members?.filter(m => m.lastActive && new Date(m.lastActive) >= lastWeek).length || 0
    };
    
    const summaryMessage = `
📊 **Weekly Summary** (${lastWeek.toLocaleDateString()} - ${new Date().toLocaleDateString()})

• ${stats.totalSessions} sessions held
• ${stats.newMembers} new members joined
• ${stats.newMaterials} materials added
• ${stats.activeMembers} active members

Keep up the great work! 🎯
    `;
    
    const notification = new BuddyNotification({
      groupId: groupId,
      type: 'summary',
      message: summaryMessage,
      metadata: stats
    });
    
    await notification.save();
    
    const weeklySummary = new WeeklySummary({
      groupId: groupId,
      weekStart: lastWeek,
      weekEnd: new Date(),
      stats
    });
    
    await weeklySummary.save();
    
    return notification;
  } catch (error) {
    console.error('Weekly summary error:', error);
  }
};