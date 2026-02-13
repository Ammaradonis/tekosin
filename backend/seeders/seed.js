require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const db = require('../models');

const NATIONALITIES = ['Afghanistan', 'Iran', 'Iraq', 'Syria', 'Turkey', 'Somalia', 'Nigeria', 'Pakistan', 'Eritrea', 'Morocco', 'Egypt', 'Lebanon', 'Palestine', 'Colombia', 'Venezuela', 'Ukraine', 'Russia', 'Georgia', 'Armenia', 'Tunisia'];
const LANGUAGES_POOL = ['de', 'en', 'tr', 'ar', 'fa', 'es', 'ku', 'so', 'ur', 'fr', 'ru', 'uk'];
const GENDERS = ['male', 'female', 'non-binary', 'transgender male', 'transgender female', 'genderqueer', 'genderfluid', 'prefer not to say'];
const PRONOUNS = ['he/him', 'she/her', 'they/them', 'he/they', 'she/they', 'ze/zir'];
const ASYLUM_STATUSES = ['pending', 'subsidiary_protection', 'asylum_granted', 'rejected', 'appeal', 'humanitarian_stay', 'other'];
const MEMBERSHIP_STATUSES = ['active', 'pending', 'inactive', 'suspended'];
const INTERESTS = ['art', 'music', 'sports', 'cooking', 'language exchange', 'photography', 'dance', 'theater', 'writing', 'gardening', 'yoga', 'meditation', 'advocacy', 'community organizing'];
const SKILLS = ['translation', 'social media', 'event planning', 'counseling', 'teaching', 'cooking', 'graphic design', 'web development', 'photography', 'first aid', 'legal knowledge', 'childcare'];

const FIRST_NAMES_DIVERSE = [
  'Ahmad', 'Fatima', 'Ali', 'Zahra', 'Mohammed', 'Aisha', 'Hassan', 'Mariam', 'Omar', 'Leila',
  'Reza', 'Nasrin', 'Mehdi', 'Sara', 'Arash', 'Parisa', 'Dara', 'Shirin', 'Kian', 'Neda',
  'Yusuf', 'Amina', 'Ibrahim', 'Halima', 'Mustafa', 'Elif', 'Emre', 'Ayşe', 'Burak', 'Zeynep',
  'Carlos', 'Maria', 'Diego', 'Sofia', 'Alejandro', 'Valentina', 'Andrei', 'Natasha', 'Dmitri', 'Olga',
  'Kwame', 'Nneka', 'Chidi', 'Amara', 'Tariq', 'Noor', 'Jamal', 'Hana', 'Sami', 'Lina',
  'Arjun', 'Priya', 'Raj', 'Ananya', 'Kofi', 'Ama', 'Yara', 'Zain', 'Layla', 'Karim',
  'Deniz', 'Ceren', 'Baran', 'Dilara', 'Cem', 'Selin', 'Murat', 'Defne', 'Serkan', 'Ebru',
  'Navid', 'Maryam', 'Babak', 'Azadeh', 'Farhad', 'Golnaz', 'Hamid', 'Roxana', 'Javad', 'Shadi'
];

const LAST_NAMES_DIVERSE = [
  'Al-Hassan', 'Ahmadi', 'Yılmaz', 'Öztürk', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Koç', 'Arslan',
  'Hosseini', 'Mohammadi', 'Rezaei', 'Moradi', 'Karimi', 'Hashemi', 'Rahimi', 'Jafari', 'Mousavi', 'Sadeghi',
  'Al-Rashid', 'Ibrahim', 'Hassan', 'Abdullah', 'Mahmoud', 'Khalil', 'Nasser', 'Saleh', 'Hamid', 'Bakir',
  'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
  'Okafor', 'Adeyemi', 'Mensah', 'Asante', 'Diallo', 'Traoré', 'Petrov', 'Ivanov', 'Kovalenko', 'Shevchenko'
];

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    await db.sequelize.authenticate();
    console.log('✅ Database connected');

    await db.sequelize.sync({ force: true });
    console.log('✅ Tables recreated');

    // Create users
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    const memberPassword = await bcrypt.hash('Member123!', 12);

    const superAdmin = await db.User.create({
      email: 'admin@tekosin.org',
      password: hashedPassword,
      firstName: 'Anna',
      lastName: 'Admin',
      role: 'super_admin',
      language: 'de',
      isActive: true,
      gdprConsent: true,
      gdprConsentDate: new Date()
    });

    const adminUser = await db.User.create({
      email: 'muco@tekosin.org',
      password: hashedPassword,
      firstName: 'Muco',
      lastName: 'Manager',
      role: 'admin',
      language: 'de',
      isActive: true,
      gdprConsent: true,
      gdprConsentDate: new Date()
    });

    // Create sub-admin users
    const subAdminRoles = ['member_manager', 'payment_manager', 'content_manager', 'event_manager', 'volunteer_manager', 'report_manager'];
    const subAdmins = [];
    for (const role of subAdminRoles) {
      const user = await db.User.create({
        email: `${role.replace('_', '.')}@tekosin.org`,
        password: hashedPassword,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role,
        language: faker.helpers.arrayElement(['de', 'en', 'tr']),
        isActive: true,
        gdprConsent: true,
        gdprConsentDate: new Date()
      });
      subAdmins.push(user);
    }

    // Create 50 member users
    const memberUsers = [];
    for (let i = 0; i < 50; i++) {
      const fn = faker.helpers.arrayElement(FIRST_NAMES_DIVERSE);
      const ln = faker.helpers.arrayElement(LAST_NAMES_DIVERSE);
      const user = await db.User.create({
        email: `${fn.toLowerCase()}.${ln.toLowerCase().replace(/[^a-z]/g, '')}${i}@example.com`,
        password: memberPassword,
        firstName: fn,
        lastName: ln,
        role: 'member',
        language: faker.helpers.arrayElement(['de', 'en', 'tr', 'ar', 'fa', 'es']),
        isActive: faker.datatype.boolean(0.9),
        lastLogin: faker.date.recent({ days: 30 }),
        gdprConsent: true,
        gdprConsentDate: faker.date.past({ years: 2 })
      });
      memberUsers.push(user);
    }

    console.log(`✅ Created ${2 + subAdmins.length + memberUsers.length} users`);

    // Create 520 members
    console.log('👥 Creating 520 members...');
    const members = [];
    for (let i = 0; i < 520; i++) {
      const fn = faker.helpers.arrayElement(FIRST_NAMES_DIVERSE);
      const ln = faker.helpers.arrayElement(LAST_NAMES_DIVERSE);
      const nationality = faker.helpers.arrayElement(NATIONALITIES);
      const memberData = {
        userId: i < 50 ? memberUsers[i].id : null,
        firstName: fn,
        lastName: ln,
        email: i < 200 ? `${fn.toLowerCase()}.${ln.toLowerCase().replace(/[^a-z]/g, '')}${i}@mail.com` : null,
        phone: faker.datatype.boolean(0.7) ? faker.phone.number('+43 6## ### ####') : null,
        dateOfBirth: faker.date.birthdate({ min: 18, max: 55, mode: 'age' }),
        gender: faker.helpers.arrayElement(GENDERS),
        pronouns: faker.helpers.arrayElement(PRONOUNS),
        nationality,
        countryOfOrigin: nationality,
        languages: faker.helpers.arrayElements(LANGUAGES_POOL, { min: 1, max: 4 }),
        address: faker.datatype.boolean(0.6) ? faker.location.streetAddress() : null,
        city: 'Wien',
        postalCode: faker.helpers.arrayElement(['1010', '1020', '1030', '1040', '1050', '1060', '1070', '1080', '1090', '1100', '1110', '1120', '1150', '1160', '1200']),
        asylumStatus: faker.helpers.arrayElement(ASYLUM_STATUSES),
        asylumApplicationDate: faker.date.past({ years: 5 }),
        membershipStatus: faker.helpers.weightedArrayElement([
          { value: 'active', weight: 50 },
          { value: 'pending', weight: 20 },
          { value: 'inactive', weight: 20 },
          { value: 'suspended', weight: 5 },
          { value: 'archived', weight: 5 }
        ]),
        membershipDate: faker.date.past({ years: 3 }),
        membershipType: faker.helpers.weightedArrayElement([
          { value: 'regular', weight: 70 },
          { value: 'supporting', weight: 20 },
          { value: 'honorary', weight: 10 }
        ]),
        emergencyContactName: faker.datatype.boolean(0.5) ? faker.person.fullName() : null,
        emergencyContactPhone: faker.datatype.boolean(0.5) ? faker.phone.number('+43 6## ### ####') : null,
        emergencyContactRelation: faker.datatype.boolean(0.5) ? faker.helpers.arrayElement(['friend', 'partner', 'sibling', 'parent', 'roommate']) : null,
        interests: faker.helpers.arrayElements(INTERESTS, { min: 0, max: 5 }),
        skills: faker.helpers.arrayElements(SKILLS, { min: 0, max: 3 }),
        notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
        isConfidential: faker.datatype.boolean(0.1),
        gdprConsent: true,
        gdprConsentDate: faker.date.past({ years: 2 }),
        photoConsent: faker.datatype.boolean(0.6)
      };
      const member = await db.Member.create(memberData);
      members.push(member);
    }
    console.log(`✅ Created ${members.length} members`);

    // Create payments (300+)
    console.log('💰 Creating payments...');
    let paymentCount = 0;
    for (let i = 0; i < 350; i++) {
      const member = faker.helpers.arrayElement(members);
      await db.Payment.create({
        memberId: member.id,
        amount: faker.helpers.arrayElement([5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 500]),
        currency: 'EUR',
        type: faker.helpers.weightedArrayElement([
          { value: 'one_time', weight: 60 },
          { value: 'recurring', weight: 25 },
          { value: 'subscription', weight: 10 },
          { value: 'refund', weight: 5 }
        ]),
        status: faker.helpers.weightedArrayElement([
          { value: 'completed', weight: 70 },
          { value: 'pending', weight: 15 },
          { value: 'failed', weight: 5 },
          { value: 'refunded', weight: 5 },
          { value: 'cancelled', weight: 5 }
        ]),
        description: faker.helpers.arrayElement(['Monthly donation', 'Event ticket', 'Membership fee', 'Fundraiser contribution', 'Annual donation', 'Emergency fund']),
        payerEmail: member.email,
        payerName: `${member.firstName} ${member.lastName}`,
        paypalOrderId: faker.datatype.boolean(0.7) ? `ORDER-${faker.string.alphanumeric(17).toUpperCase()}` : null,
        createdAt: faker.date.past({ years: 2 })
      });
      paymentCount++;
    }
    console.log(`✅ Created ${paymentCount} payments`);

    // Create events (30+)
    console.log('📅 Creating events...');
    const eventTypes = ['meeting', 'workshop', 'social', 'fundraiser', 'support_group', 'training'];
    const events = [];
    for (let i = 0; i < 35; i++) {
      const startDate = faker.date.between({ from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) });
      const event = await db.Event.create({
        title: {
          de: faker.helpers.arrayElement(['Gemeinschaftstreffen', 'Workshop: Rechte kennen', 'Kulturabend', 'Sprachcafé', 'Yoga & Meditation', 'Filmabend', 'Kochabend', 'Pride Vorbereitung', 'Selbsthilfegruppe', 'Fundraiser Gala']),
          en: faker.helpers.arrayElement(['Community Meeting', 'Workshop: Know Your Rights', 'Cultural Evening', 'Language Café', 'Yoga & Meditation', 'Movie Night', 'Cooking Evening', 'Pride Preparation', 'Support Group', 'Fundraiser Gala']),
          tr: 'Topluluk Etkinliği', ar: 'حدث مجتمعي', fa: 'رویداد اجتماعی', es: 'Evento Comunitario'
        },
        description: {
          de: faker.lorem.paragraph(), en: faker.lorem.paragraph(),
          tr: '', ar: '', fa: '', es: ''
        },
        type: faker.helpers.arrayElement(eventTypes),
        startDate,
        endDate: new Date(startDate.getTime() + faker.number.int({ min: 1, max: 4 }) * 60 * 60 * 1000),
        location: faker.helpers.arrayElement(['Schwarzhorngasse 1, 1050 Wien', 'Online', 'Türkis Rosa Lila Villa', 'WUK', 'Brunnenmarkt', 'Museumsquartier']),
        isOnline: faker.datatype.boolean(0.3),
        onlineLink: faker.datatype.boolean(0.3) ? 'https://zoom.us/j/' + faker.string.numeric(10) : null,
        maxParticipants: faker.helpers.arrayElement([20, 30, 50, 100, null]),
        currentParticipants: faker.number.int({ min: 0, max: 30 }),
        status: startDate > new Date() ? 'planned' : faker.helpers.arrayElement(['completed', 'active']),
        isPublic: faker.datatype.boolean(0.8)
      });
      events.push(event);
    }
    console.log(`✅ Created ${events.length} events`);

    // Create volunteers (60+)
    console.log('🤝 Creating volunteers...');
    for (let i = 0; i < 65; i++) {
      await db.Volunteer.create({
        eventId: faker.helpers.arrayElement(events).id,
        firstName: faker.helpers.arrayElement(FIRST_NAMES_DIVERSE),
        lastName: faker.helpers.arrayElement(LAST_NAMES_DIVERSE),
        email: faker.internet.email(),
        phone: faker.phone.number('+43 6## ### ####'),
        skills: faker.helpers.arrayElements(SKILLS, { min: 1, max: 3 }),
        availability: { weekdays: faker.datatype.boolean(), weekends: faker.datatype.boolean(), evenings: faker.datatype.boolean() },
        status: faker.helpers.arrayElement(['active', 'inactive', 'pending']),
        hoursLogged: faker.number.float({ min: 0, max: 200, fractionDigits: 1 }),
        notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null
      });
    }
    console.log('✅ Created 65 volunteers');

    // Create documents (200+)
    console.log('📄 Creating documents...');
    for (let i = 0; i < 220; i++) {
      const member = faker.helpers.arrayElement(members);
      await db.Document.create({
        memberId: member.id,
        type: faker.helpers.arrayElement(['id_document', 'asylum_paper', 'medical', 'legal', 'other']),
        name: faker.helpers.arrayElement(['Passport Copy', 'Asylum Application', 'Medical Certificate', 'Legal Brief', 'ID Card', 'Residence Permit', 'Insurance Card', 'Birth Certificate']),
        filePath: `/uploads/docs/${faker.string.alphanumeric(12)}.pdf`,
        mimeType: 'application/pdf',
        size: faker.number.int({ min: 10000, max: 5000000 }),
        isEncrypted: true,
        expiryDate: faker.datatype.boolean(0.5) ? faker.date.future({ years: 3 }) : null,
        status: faker.helpers.arrayElement(['valid', 'expired', 'pending_review', 'archived'])
      });
    }
    console.log('✅ Created 220 documents');

    // Create notes (150+)
    console.log('📝 Creating notes...');
    for (let i = 0; i < 160; i++) {
      const member = faker.helpers.arrayElement(members);
      await db.Note.create({
        memberId: member.id,
        authorId: faker.helpers.arrayElement([superAdmin.id, adminUser.id, ...subAdmins.map(s => s.id)]),
        type: faker.helpers.arrayElement(['general', 'confidential', 'medical', 'legal', 'emergency']),
        title: faker.lorem.sentence({ min: 3, max: 8 }),
        content: faker.lorem.paragraphs({ min: 1, max: 3 }),
        isConfidential: faker.datatype.boolean(0.2),
        isEncrypted: faker.datatype.boolean(0.1)
      });
    }
    console.log('✅ Created 160 notes');

    // Create services (100+)
    console.log('🛠️ Creating services...');
    for (let i = 0; i < 110; i++) {
      const member = faker.helpers.arrayElement(members);
      await db.Service.create({
        memberId: member.id,
        type: faker.helpers.arrayElement(['counseling', 'language_course', 'social_activity', 'health_referral', 'peer_support', 'other']),
        name: faker.helpers.arrayElement(['German Course A1', 'German Course A2', 'Peer Counseling', 'Yoga Class', 'Art Therapy', 'Legal Info Session', 'Health Screening', 'Social Integration Workshop']),
        description: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(['active', 'completed', 'pending', 'cancelled']),
        startDate: faker.date.past({ years: 1 }),
        endDate: faker.datatype.boolean(0.5) ? faker.date.future({ years: 1 }) : null,
        provider: faker.helpers.arrayElement(['TÊKOȘÎN', 'Caritas', 'Diakonie', 'Queer Base', 'UNHCR', 'Volkshilfe']),
        notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null
      });
    }
    console.log('✅ Created 110 services');

    // Create referrals (80+)
    console.log('🔗 Creating referrals...');
    for (let i = 0; i < 85; i++) {
      const member = faker.helpers.arrayElement(members);
      await db.Referral.create({
        memberId: member.id,
        referredTo: faker.person.fullName(),
        organization: faker.helpers.arrayElement(['Caritas', 'Diakonie', 'Queer Base', 'UNHCR', 'Volkshilfe', 'Ärzte ohne Grenzen', 'Rotes Kreuz', 'Amnesty International']),
        type: faker.helpers.arrayElement(['medical', 'legal', 'psychological', 'social', 'housing_info', 'other']),
        status: faker.helpers.arrayElement(['pending', 'accepted', 'completed', 'declined']),
        reason: faker.lorem.sentence(),
        outcome: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
        referralDate: faker.date.past({ years: 1 }),
        followUpDate: faker.datatype.boolean(0.5) ? faker.date.future({ years: 1 }) : null
      });
    }
    console.log('✅ Created 85 referrals');

    // Create content (25+)
    console.log('📰 Creating content...');
    for (let i = 0; i < 28; i++) {
      await db.Content.create({
        authorId: faker.helpers.arrayElement([superAdmin.id, adminUser.id]),
        type: faker.helpers.arrayElement(['page', 'blog', 'document', 'announcement']),
        title: {
          de: faker.lorem.sentence({ min: 3, max: 8 }),
          en: faker.lorem.sentence({ min: 3, max: 8 }),
          tr: '', ar: '', fa: '', es: ''
        },
        slug: faker.helpers.slugify(faker.lorem.words(3)).toLowerCase() + '-' + i,
        body: {
          de: faker.lorem.paragraphs(3),
          en: faker.lorem.paragraphs(3),
          tr: '', ar: '', fa: '', es: ''
        },
        excerpt: {
          de: faker.lorem.sentence(),
          en: faker.lorem.sentence(),
          tr: '', ar: '', fa: '', es: ''
        },
        status: faker.helpers.arrayElement(['draft', 'published', 'archived']),
        category: faker.helpers.arrayElement(['news', 'events', 'resources', 'stories', 'updates']),
        tags: faker.helpers.arrayElements(['lgbtiq', 'refugees', 'vienna', 'community', 'rights', 'health', 'culture'], { min: 1, max: 4 }),
        publishedAt: faker.datatype.boolean(0.6) ? faker.date.past({ years: 1 }) : null
      });
    }
    console.log('✅ Created 28 content items');

    // Create notifications (200+)
    console.log('🔔 Creating notifications...');
    const allUsers = [superAdmin, adminUser, ...subAdmins, ...memberUsers];
    for (let i = 0; i < 210; i++) {
      const user = faker.helpers.arrayElement(allUsers);
      await db.Notification.create({
        userId: user.id,
        type: faker.helpers.arrayElement(['info', 'warning', 'error', 'success', 'urgent']),
        channel: 'in_app',
        title: faker.helpers.arrayElement([
          'New member registered', 'Payment received', 'Event reminder',
          'Document expiring soon', 'System update', 'New message',
          'URGENT: Action required', 'Weekly report ready'
        ]),
        message: faker.lorem.sentence(),
        isRead: faker.datatype.boolean(0.6),
        readAt: faker.datatype.boolean(0.6) ? faker.date.recent({ days: 7 }) : null,
        createdAt: faker.date.recent({ days: 30 })
      });
    }
    console.log('✅ Created 210 notifications');

    // Create audit logs (300+)
    console.log('📋 Creating audit logs...');
    const actions = ['LOGIN', 'LOGOUT', 'CREATE_MEMBER', 'UPDATE_MEMBER', 'DELETE_MEMBER', 'CREATE_PAYMENT', 'VIEW_REPORT', 'EXPORT_DATA', 'UPDATE_SETTINGS', 'CREATE_EVENT', 'SEND_NOTIFICATION'];
    for (let i = 0; i < 320; i++) {
      const user = faker.helpers.arrayElement(allUsers);
      await db.AuditLog.create({
        userId: user.id,
        action: faker.helpers.arrayElement(actions),
        entity: faker.helpers.arrayElement(['User', 'Member', 'Payment', 'Event', 'Content', 'Notification']),
        entityId: faker.string.uuid(),
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        createdAt: faker.date.recent({ days: 60 })
      });
    }
    console.log('✅ Created 320 audit logs');

    // Create newsletters (10)
    console.log('📧 Creating newsletters...');
    for (let i = 0; i < 10; i++) {
      await db.Newsletter.create({
        subject: {
          de: faker.lorem.sentence({ min: 3, max: 6 }),
          en: faker.lorem.sentence({ min: 3, max: 6 }),
          tr: '', ar: '', fa: '', es: ''
        },
        body: {
          de: faker.lorem.paragraphs(2),
          en: faker.lorem.paragraphs(2),
          tr: '', ar: '', fa: '', es: ''
        },
        status: faker.helpers.arrayElement(['draft', 'scheduled', 'sent']),
        recipientCount: faker.number.int({ min: 50, max: 400 }),
        sentAt: faker.datatype.boolean(0.5) ? faker.date.past({ years: 1 }) : null,
        template: faker.helpers.arrayElement(['default', 'event', 'urgent', 'newsletter'])
      });
    }
    console.log('✅ Created 10 newsletters');

    const totalRecords = 58 + 520 + 350 + 35 + 65 + 220 + 160 + 110 + 85 + 28 + 210 + 320 + 10;
    console.log(`\n🎉 Seeding complete! Total records: ${totalRecords}`);
    console.log('\n📋 Login credentials:');
    console.log('  Super Admin: admin@tekosin.org / Admin123!');
    console.log('  Admin: muco@tekosin.org / Admin123!');
    console.log('  Sub-admins: [role]@tekosin.org / Admin123!');
    console.log('  Members: [name]@example.com / Member123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
