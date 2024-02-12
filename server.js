import { serve } from "https://deno.land/std@0.185.0/http/server.ts"
import { serveDir } from "https://deno.land/std@0.185.0/http/file_server.ts"
import { generate_name } from "./modules/generate_name.js"
import { generate } from "https://deno.land/std@0.213.0/uuid/v1.ts";

const server_id = {
   no   : generate (),
   name : generate_name (`server`),
}

const sockets = new Map ()
let ctrl = false
// const kv = await Deno.openKv ()
const kv = await Deno.openKv (`/Users/capo_greco/Documents/kv/local`)

const delete_all_entries = async () => {
   const iter = await kv.list ({ prefix : [] })
   for await (const { key } of iter) {
      await kv.delete (key)
   }
}

delete_all_entries ()

const update_ctrl = async () => {
   if (!ctrl) return
   if (ctrl.socket.readyState != 1) return
   const iter = await kv.list ({ prefix : [ `synth` ] })
   const synth_entries = []
   for await (const { value } of iter) {
      synth_entries.push (value)
   }
   const msg = {
      method  : `list`,
      content : synth_entries,
   }
   ctrl.socket.send (JSON.stringify (msg))
}

const recursive_ping = async (socket) => {
   ping_socket (socket)
   if (socket.readyState == 1) {
      setTimeout (recursive_ping, 5000, socket)
   }
}

const ping_socket = async (socket) => {
   if (socket.readyState == 1) {
      socket.send (JSON.stringify ({
         method  : `ping`,
         content : Date.now (),
      }))
   }
}

const ping_local_sockets = async () => {
   // if (sockets.size == 0) return
   // for await (const e of sockets) {
   //    const v = e[1]
   //    // console.log (`pinging ${ v.id.name }`)
   //    if (v.socket.readyState == 1) {
   //       v.socket.send (JSON.stringify ({
   //          method  : `ping`,
   //          content : Date.now (),
   //       }))   
   //    }
   // }
   // setTimeout (ping_local_sockets, 5000)
}

const clean_local_sockets = async () => {
   if (sockets.size == 0) return
   const redundant = []
   for await (const e of sockets) {
      const v = e[1]
      if (v.socket.readyState > 1) redundant.push (v.id)
   }
   for await (const id of redundant) {
      sockets.delete (id.no)
      await kv.delete ([ id.type, id.no])
   }
   setTimeout (clean_local_sockets, 1000)
}

const check_kv_entries = async () => {
   if (!is_control) return
   const iter = await kv.list ({ prefix : [] })
   const entries = []
   for await (const { value } of iter) {
      entries.push (value)
   }
   for await (const e of entries) {
      if (e.last_update < Date.now () - 20000) {
         await kv.delete ([ e.id.type, e.id.no ])
      }
   }
   // console.log (redundant.length)
   for await (const e of redundant) {
      await kv.delete ([ e.id.type, e.id.no ])
      console.log (`deleted: ${ e.id.no }`)
   }
   update_ctrl ()
   setTimeout (check_kv_entries, 5000)
}


const manage_synth = async (msg, id) => {
   const manage_method = {
      pong : () => manage_pong (msg, id),
      audio_enabled : async () => {
         const { value } = await kv.get ([ id.type, id.no ])
         value.audio_enabled = msg.content.audio_enabled
         await kv.set ([ id.type, id.no ], value)
         update_ctrl ()
      }
   }
   manage_method[msg.method] ()
}

const manage_ctrl  = async (msg, id) => {
   const manage_method = {
      pong: () => manage_pong (msg, id),
   }
   manage_method[msg.method] ()
}

const manage_pong = async (msg, id) => {
   const { value } = await kv.get ([ id.type, id.no ])
   const now = Date.now ()
   value.ping.last_update = now
   value.ping.time = (now - msg.content) * 0.5
   // console.log (`${ id.name }'s ping is ${ value.ping }ms`)
   await kv.set ([ id.type, id.no ], value)
}

const req_handler = async incoming_req => {
   let req = incoming_req
   const path = new URL (req.url).pathname
   const upgrade = req.headers.get ("upgrade") || ""
   if (upgrade.toLowerCase () == "websocket") {
      const { socket, response } = Deno.upgradeWebSocket (req)
      const id = {
         no   : req.headers.get (`sec-websocket-key`),
         name : path == `/ctrl` ? `ctrl` : generate_name (`synth`),
         type : path == `/ctrl` ? `ctrl` : `synth`,
         server : server_id,
      }
      const ping = {
         time: null,
         last_update: Date.now (),
      }
      const audio_enabled = false
      sockets.set (id.no, { socket, id, ping, audio_enabled })
      if (sockets.size == 1) {
         setTimeout (ping_local_sockets, 5000)
         setTimeout (clean_local_sockets, 1000)
      }
      socket.onopen = async () => {
         if (id.type == `ctrl`) {
            ctrl = { socket, id, ping }
            // const iter = await kv.list ({ prefix : [] })
            // const ctrl_array = []
            // for await (const { key, value } of iter) {
            //    if (value.id.type == `ctrl`)
            //    ctrl_array.push (key)
            //    ctrl_array.push (value)
            // }
            // console.dir (ctrl_array.length)
            // if (ctrl_array.length > 0) {
            //    console.log (`there is already a controller connected`)
            //    return
            // }
         }
         const val = { id, ping, audio_enabled }
         kv.set ([ id.type, id.no ], val)

         socket.send (JSON.stringify ({
            method  : `id`,
            content : id,
         }))

         setTimeout (recursive_ping, 5000, socket)

         const stream = kv.watch ([[ `synth`, id.no ]])
         for await (const e of stream) update_ctrl ()

      }
      socket.onmessage = async m => {
         const msg = JSON.parse (m.data)
         const manage_type = {
            synth   : () => manage_synth (msg, id),
            ctrl    : () => manage_ctrl  (msg, id),
         }
         manage_type[msg.type] ()
      }
      socket.onerror = e => console.log(`socket error: ${ e.message }`)
      socket.onclose = async () => {
         await kv.delete ([ id.type, id.no ])
      }

      return response
   }
   
   const options = {
      fsRoot : `public`,
      index  : `index.html`,
   }

   return serveDir (req, options)
}

serve (req_handler, { port: 80 })
