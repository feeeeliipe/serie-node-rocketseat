const express = require ('express');
const authMiddleware = require('../middlewares/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().populate(['user', 'tasks']);
        return res.send({projects});    
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Internal server error' })    
    }
});

router.get('/:projectId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId).populate(['user', 'tasks']);
        return res.send(project);    
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Internal server error' })    
    }
});

router.post('/', async (req, res) => {
    try {
        const { title, description, tasks } = req.body;

        const project = await Project.create({ title, description, user: req.userId });   
        await Promise.all(tasks.map(async task => {
            const taskTitle = task.title;        
            const projectTask = new Task({ title: taskTitle, assignedToo: req.userId, project: project._id });
            await projectTask.save();
            project.tasks.push(projectTask);
        }));

        await project.save();
        return res.send(project);     
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Internal server error' })
    }
})

router.put('/:projectId', async (req, res) => {
    try {
        const { title, description, tasks } = req.body;

        const project = await Project.findByIdAndUpdate(req.params.projectId, { title, description, user: req.userId }, { new: true });   
        
        project.tasks = [];
        await Task.remove( { project: project._id } );
        
        await Promise.all(tasks.map(async task => {
            const taskTitle = task.title;        
            const projectTask = new Task({ title: taskTitle, assignedToo: req.userId, project: project._id });
            await projectTask.save();
            project.tasks.push(projectTask);
        }));

        await project.save();
        return res.send(project);     
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Internal server error' })
    }
});

router.delete('/:projectId', async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.projectId);
        return res.status(204).send();     
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Internal server error' })
    }
});

module.exports = (app) => {
    app.use('/projects', router);
}