import { Router } from 'express';
import { getInfo, downloadMp4, downloadMp3 } from '../controllers/mediaController.js';
import { validateYouTubeUrl } from '../middleware/validateUrl.js';


const mediaRouter = Router();


mediaRouter.get('/info', validateYouTubeUrl, getInfo);
mediaRouter.get('/download/mp4', validateYouTubeUrl, downloadMp4);
mediaRouter.get('/download/mp3', validateYouTubeUrl, downloadMp3);


export default mediaRouter;