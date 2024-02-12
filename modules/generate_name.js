import { uniqueNamesGenerator, adjectives, animals, colors, names } from "npm:unique-names-generator@4.2.0"

export function generate_name (type) {

    const options = {
       synth: { 
          dictionaries: [ names, adjectives ],
          style: `capital`,
          separator: ` the `,
          length: 2 
       },
       server: {
          dictionaries: [ colors, animals ],
          style: `capital`,
          separator: ` `,
          length: 2
       },
    }

    const name = uniqueNamesGenerator (options[ type ])

    return `${ type == `server` ? `The ` : `` }${ name }`
 }
 