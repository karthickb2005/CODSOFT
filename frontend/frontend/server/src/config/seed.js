const path = require('path');
const logger = require('../utils/logger');
const Project = require(path.join(__dirname, '../models/Project'));
const Task = require(path.join(__dirname, '../models/Task'));
const TeamMember = require(path.join(__dirname, '../models/TeamMember'));

const seedData = async () => {
    try {
        logger.info('--- Seeding Data ---');

        // Clear existing data
        await Project.deleteMany({});
        await Task.deleteMany({});
        await TeamMember.deleteMany({});

        // Create Team Members
        await TeamMember.create([
            {
                user_email: 'samraaj@example.com',
                display_name: 'Samraaj M M',
                job_title: 'Full Stack Engineer',
                department: 'Product',
                role: 'admin',
                skills: [
                    { name: 'React', level: 'expert' },
                    { name: 'Node.js', level: 'advanced' }
                ],
                current_workload: 45,
                burnout_risk: 'low'
            },
            {
                user_email: 'alice@example.com',
                display_name: 'Alice Johnson',
                job_title: 'UI/UX Designer',
                department: 'Design',
                role: 'team_leader',
                skills: [
                    { name: 'Figma', level: 'expert' },
                    { name: 'Tailwind CSS', level: 'intermediate' }
                ],
                current_workload: 85,
                burnout_risk: 'high'
            },
            {
                user_email: 'bob@example.com',
                display_name: 'Bob Smith',
                job_title: 'Backend Developer',
                department: 'Infrastructure',
                role: 'member',
                skills: [
                    { name: 'MongoDB', level: 'advanced' },
                    { name: 'Python', level: 'intermediate' }
                ],
                current_workload: 20,
                burnout_risk: 'low'
            }
        ]);

        // Create projects
        const project1 = await Project.create({
            name: 'Website Redesign',
            description: 'Modernizing the main landing page and dashboard.',
            status: 'active',
            health_status: 'excellent',
            member_emails: ['samraaj@example.com', 'ai@taskpilot.com'],
            progress: 65
        });

        const project2 = await Project.create({
            name: 'Mobile App POC',
            description: 'Developing a proof of concept for the TaskPilot mobile app.',
            status: 'planning',
            health_status: 'good',
            member_emails: ['samraaj@example.com'],
            progress: 15
        });

        const project3 = await Project.create({
            name: 'API V2 Migration',
            description: 'Upgrading the backend infrastructure for scale.',
            status: 'on_hold',
            health_status: 'at_risk',
            member_emails: ['infra@example.com'],
            progress: 40
        });

        // Create tasks
        await Task.create([
            {
                title: 'Design new Hero section',
                description: 'Create high-fidelity mockups for the landing page hero.',
                status: 'done',
                priority: 'high',
                project_id: project1._id,
                assignee_email: 'samraaj@example.com',
                due_date: new Date()
            },
            {
                title: 'Implement Auth flow',
                description: 'Connect login and signup pages to the new API.',
                status: 'in_progress',
                priority: 'medium',
                project_id: project1._id,
                assignee_email: 'ai@taskpilot.com',
                due_date: new Date(Date.now() + 86400000 * 2) // 2 days from now
            },
            {
                title: 'Wireframe mobile dashboard',
                description: 'Rough sketches of the main mobile view.',
                status: 'todo',
                priority: 'low',
                project_id: project2._id,
                due_date: new Date(Date.now() + 86400000 * 5)
            }
        ]);

        logger.info('✔ Seeding completed successfully');
    } catch (error) {
        logger.error(`✖ Error seeding data: ${error.message}`);
    }
};

module.exports = seedData;
