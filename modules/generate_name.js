import { uniqueNamesGenerator, adjectives, names } from "npm:unique-names-generator@4.2.0"

export function generate_name () {

   return uniqueNamesGenerator ({
      dictionaries: [ names, adjectives ],
      style: `capital`,
      separator: ` the `,
      length: 2 
   })

}
 