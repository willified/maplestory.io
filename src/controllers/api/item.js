import express from 'express';
import r from 'rethinkdb'
import Promise from 'bluebird'
import MapleItem from '../../models/mapleitem'
import World from '../../models/world'
import API from '../../lib/API'
import apicache from 'apicache'
import redis from 'redis'
import { ENV, PORT, DATADOG_API_KEY, DATADOG_APP_KEY, REDIS_HOST, REDIS_PORT } from '../../environment'

const router = express.Router();

let redisClient
if (REDIS_HOST && REDIS_PORT) {
  redisClient = redis.createClient({
    host: REDIS_HOST,
    port: REDIS_PORT
  })
  console.warn('Item - Redis caching enabled')
} else {
  console.warn('Item - Redis not enabled')
}

const caching = apicache.options({
    debug: ENV.NODE_ENV == 'development',
    defaultDuration: 43200000,
    enabled: true,
    redisClient
  }).middleware

//Try to cache the results for at least 12 hours as CPU is also costly
//router.use(caching())

API.registerCall(
  '/api/item/:itemId/icon',
  'Gets the inventory icon of an item',
  API.createParameter(':itemId', 'number', 'The ID of the item'),
  'Image/PNG'
)

router.get('/:itemId/icon', async (req, res, next) => {
  try{
    const itemId = Number(req.params.itemId)
    if (itemId === null || itemId === undefined || Number.isNaN(itemId)) return res.status(400).send({ error: 'Invalid item' })
    const item = await MapleItem.getFirst(itemId)

    if(!item || !item.Icon || !item.Icon.Icon) return res.status(404).send('Couldn\'t find an icon for that item.')

    const iconData = new Buffer(item.Icon.Icon, 'base64')
    res.set('Content-Type', 'image/png')
      .send(iconData)
  }catch(ex){
    res.status(500).send({error: ex.message || ex, trace: ex.trace || null, stack: ex.stack || null})
    console.log(ex, ex.stack)
  }
})

API.registerCall(
  '/api/item/:itemId/iconRaw',
  'Gets the raw icon of an item',
  API.createParameter(':itemId', 'number', 'The ID of the item'),
  'Image/PNG'
)

router.get('/:itemId/iconRaw', async (req, res, next) => {
  try{
    const itemId = Number(req.params.itemId)
    if (itemId === null || itemId === undefined || Number.isNaN(itemId)) return res.status(400).send({ error: 'Invalid item' })
    const item = await MapleItem.getFirst(itemId)

    if(!item || !item.Icon || !item.Icon.IconRaw) return res.status(404).send('Couldn\'t find an icon for that item.')

    const iconData = new Buffer(item.Icon.IconRaw, 'base64')
    res.set('Content-Type', 'image/png')
      .send(iconData)
  }catch(ex){
    res.status(500).send({error: ex.message || ex, trace: ex.trace || null, stack: ex.stack || null})
    console.log(ex, ex.stack)
  }
})

API.registerCall(
  '/api/item/list',
  'Gets a listing of all items we know of',
  [],
  [
    { id: 12345, name: 'Awesome Weapon' }
  ]
)

router.get('/list/:includeHair?', async (req, res, next) => {
  try{
    const items = await MapleItem.getList(req.params.includeHair || false)
    res.success(items)
  }catch(ex){
    res.status(500).send({error: ex.message || ex, trace: ex.trace || null, stack: ex.stack || null})
    console.log(ex, ex.stack)
  }
})

API.registerCall(
  '/api/item/:itemId',
  'Gets a single item',
  API.createParameter(':itemId', 'number', 'The ID of the item'),
  {
    Description: '...',
    MetaInfo: '...',
    TypeInfo: '...',
    id: 1382223
  }
)

router.get('/:itemId', async (req, res, next) => {
  try{
    const itemId = Number(req.params.itemId)
    if (itemId === null || itemId === undefined || Number.isNaN(itemId)) return res.status(400).send({ error: 'Invalid item' })
    const item = await MapleItem.getFirst(itemId)
    if(!item) return res.status(404).send('Couldn\'t find that item.')
    res.success(item)
  }catch(ex){
    res.status(500).send({error: ex.message || ex, trace: ex.trace || null, stack: ex.stack || null})
    console.log(ex, ex.stack)
  }
})

export default router