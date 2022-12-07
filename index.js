const express = require('express');
const app = express();
var cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { v4: uuidv4, validate: uuidValidate} = require('uuid')
require('dotenv').config()  

const client = new MongoClient(process.env.FINAL_URL);
const port = 1337;

app.use(express.static('public'));
app.use(bodyParser.json());

app.use(cors());

//Root route
app.get('/', (req, res) => {
    res.status(300).redirect('/info.html');
});

// Playlists

// Get all playlists
// For Testing Purposes
app.get('/allplaylists', async (req, res) => {
    try {
        await client.connect();

        const colli = client.db('courseproject').collection('playlists');
        const pll = await colli.find({}).toArray();

        res.status(200).send(pll);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    } finally {
        await client.close();
    }
});

// Get all playlists from user
// /playlist?userId=1
app.get('/playlists', async (req, res) => {
    try {
        await client.connect();

        const colli = client.db('courseproject').collection('playlists');

        const query = { user_id: req.query.userId};
        console.log(query);

        const pll = await colli.find(query).toArray();

        if(pll){
            res.status(200).send(pll);
        }else{
            res.status(400).send('Could not find playlist with id' + req.query.userId);
        }

        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    } finally {
        await client.close();
    }
});

// Get Playlist From User by ID
// /playlist?userIdid=1&playlistId=1
app.get('/playlist', async (req, res) => {
    // if (!req.body.userId || !req.body.playlistId) {
    //     res.status(400).send('Bad request: missing name and/or description');
    //     return;
    // }

    try {
        await client.connect();

        const colli = client.db('courseproject').collection('playlists');

        const query = { user_id: req.query.userId, playlist_id: req.query.playlistId };
        console.log(query);

        // const pll = await colli.findOne({
        //     user_id: req.query.userId, $and: [ {playlist_id: req.query.playlistId}]
        // });
        const pll = await colli.findOne(query);

        if(pll){
            res.status(200).send(pll);
        }else{
            res.status(400).send('Could not find playlist with id' + req.query.id);
        }

        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    } finally {
        await client.close();
    }
});

// Delete Playlist by ID
// /playlist?id=1
app.delete('/playlist', async (req,res) => {
    try{
        await client.connect();
        const colli = client.db('courseproject').collection('playlists');

        const query = { user_id: req.query.userId, playlist_id: req.query.playlistId };
        console.log(query);

        const pll = await colli.deleteOne(query);

        if(pll){
            res.status(200).send('Deleted playlist with id: ' + req.query.playlistId + ' from User with id: ' + req.query.userId);
            return;
        }else{
            res.status(400).send('Could not find playlist with id: ' + req.query.playlistId + ' from User with id: ' + req.query.userId);
        }
      
    }catch(error){
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    }finally {
        await client.close();
    }
});

// Delete Song by ID
// /playlist/song?playlistId=1&songId=1
app.delete('/playlist/song', async (req,res) => {
    try{
        await client.connect();
        const colli = client.db('courseproject').collection('playlists');

        // Deletes song from songs array by id
        const pll = colli.updateOne(
            { user_id: req.query.userId, playlist_id: req.query.playlistId }, 
            { $pull: { songs: { song_id: req.query.songId } } },
            {multi:true} 
        );

        if(pll){
            res.status(200).send('Deleted Song with id ' + req.query.songId + ' from Playlist with id ' + req.query.playlistId);
            return;
        }else{
            res.status(400).send('Could not Find Song with id ' + req.query.songId + 'from Playlist with id ' + req.query.playlistId);
        }
      
    }catch(error){
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    }finally {
        // await client.close();
    }
});

// Creates new playlist
app.put('/playlist', async (req, res) => {
    if (!req.body.playlist_name || !req.body.playlist_desc) {
        res.status(400).send('Bad request: missing name and/or description');
        return;
    }

    try {
        //connect to the db
        await client.connect();
        //retrieve the coursedata collection data
        const colli = client.db('courseproject').collection('playlists');

        // Create new playlist
        let newPlaylist = {
            playlist_id: uuidv4(),
            playlist_name: req.body.playlist_name,
            playlist_desc: req.body.playlist_desc,
            user_id: req.body.user_id,
            songs: []
        }

        // Insert into the database
        let insertResult = await colli.insertOne(newPlaylist);

        //Send back successmessage
        res.status(201).json(insertResult);
        return;
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    } finally {
        await client.close();
    }
});

// Adds Song to Playlist
// /playlist/song?userId=1&playlistId=1&songId=1
app.post('/playlist/song', async (req, res) => {
    if (!req.query.playlistId || !req.query.songId) {
        res.status(400).send('Bad request: missing playlist ID and/or song ID');
        return;
    }

    try {
        await client.connect();
        const colli = client.db('courseproject').collection('playlists');

        const pll = colli.updateOne(
            { user_id: req.query.userId, playlist_id: req.query.playlistId }, 
            { $push: { songs: { song_id: req.query.songId } } },
            {multi:true} 
        );

        if(pll){
            res.status(200).send('Added Song with id ' + req.query.songId + ' To Playlist with id ' + req.query.playlistId);
            return;
        }else{
            res.status(400).send('Could not Find Song with id ' + req.query.songId + 'from Playlist with id ' + req.query.playlistId);
        }

    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    } finally {
        // await client.close();
    }
});

app.listen(port, () => {
    console.log(`API is running at http://localhost:${port}`);
})