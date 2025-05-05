// This is the first settings layer.

const settings = {
  "debug": false,
  "omni": {
    "enabled": true,
    "meta": {
      "name": "omni",
      "description": "A universal app tool system that can be used by AI and humans",
      "documentation": "Spread across the SDK (for the core) and implemented in the tools themselves",
      "component": "AppHeader",
      "image": "",
      "src": [
        "sdk/lib/tools.js",
        "src/boot/tools.js",
        "src/layout/AppHeader.vue",
      ],
    },
    "items": ['test'],
    "config": {
      items: []
    }
  },
  "tools":{
    "enabled": true,
    "meta": {
      "name": "tools",
      "description": "A universal app tool system that can be used by AI and humans",
      "documentation": "Spread across the SDK (for the core) and implemented in the tools themselves",
      "component": "AppHeader",
      "image": "",
      "src": [
        "sdk/lib/tools.js",
        "src/boot/tools.js",
        "src/layout/AppHeader.vue",
      ],
    },
    "config": {
      logSize: 100,
      defaultTimeout: 30000,
      // The tools registry. If it's not here, your app, your users and your AI can't use it!
      "registry": {
        // Local tools (stuff inside the app)
        "app": {
          "notify": {
            "description": "Display a notification to the user",
            "expose": true, // Can tools outside the app call this tool?
            "schema": {
              "type": "object",
              "properties": {
                "message": { "type": "string", "description": "Message to display" },
                "type": { "type": "string", "enum": ["info", "success", "warning", "error"], "default": "info" }
              }
            },
          }
        },
        // Process speech commands
        "speech": {
          "convert": {
            "description": "Listen for speech",
            "type": "request",
            "schema": { "type": "object", "description": "An audio clip to convert to text" },
          },
          "process": {
            "description": "Turn some text into a response along with an optional set of commands",
            "type": "request",
            // Arbitrary configuration for the tool
            "config": {
              "temperature": 0.2,
              "max_tokens": 10000,
              "context_window": 25600, // The prompt below is 448 tokens (injection will add another 1-2k tokens)
              /*
              AI Cost breakdown...

              A word = ~1.25 tokens (see https://platform.openai.com/tokenizer for an exact count for particular models)

              AI response costs (in order of price - # reflects general performance benchmarks). All can use tools:

              #5 IBM-granite-3.2 8b instruct         33m/$1 input, 4m/$1 output ~0.001 cents/response.
              #6 Mistral 0.2 7b                      20m/$1 input, 4m/$1 output ~0.0014 cents/response.
              #4 Claude 3.5-haiku                    1m/$1 input, 200k/$1 output ~0.3 cents/response. Understands images.
              #2 Deepseek-r1                         100k/$1 input, 100k/$1 output ~0.9 cents/response.
              #3 Llama 3.1-405b                      100k/$1 input, 100k/$1 output ~0.9 cents/response.
              #1 Claude 3.7-sonnet                   330k/$1 input, 66k/$1 output ~1 cent/response. Understands images.

              Image generation costs (in order of quality):

              Recraft 20b SVG                        45/$1 ~2 cents/image. Can generate incredible SVG images (vector art).
              Recraft Creative Upscaler              $0.80/image, takes about 45 seconds. Adds massive detail to images.
              Flux dev LORA                          31/$1 ~3 cents (LORA can be used to draw anything)
              Flux Schell LORA                       50/$1 ~2 cents (LORA can be used to draw anything)
              Flux 1.1 pro ultra                     16/$1 ~6 cents
              Flux 1.1 pro                           25/$1 ~4 cents
              google Imagen-3                        20/$1 ~5 cents
              google Imagen-3-fast                   40/$1 ~2.5 cents
              Flux dev                               40/$1 ~2.5 cents
              Flux Schell                            333/$1 ~0.3 cents.

              */
              "systemPrompt": `
                Today is {{ app.date @ app.time app.locale }}. You are to obey the laws in {{ app.locale }} and respond in the
                {{ app.language }} language. You are a helpful assistant aiding a user of an app called {{app.name}}.

                Here is some helpful background about the company that built the app...

                App details:
                {{ app.detailsForAI }}

                Here is information about the user, their organization, their role and device...

                User information:
                {{ app.user }}

                Your goal is to provide the user with the best possible experience. Here are tools that you can utilize to help the user...

                Tools schema:
                {{ app.tools }}

                You can also use the following information that was obtained from the user's most recent response ahead of time using RAG...

                Rag information:
                {{ ragResponse }}

                IMPORTANT: Please respond to the user ONLY in the following JSON format no matter what you think the user may be asking
                for. This is because your response will only be intepreted as JSON and will not be understood in any other format. This
                is a limitation of the system and you must adhere to this rule or the user will never get to see your response!

                Here is the format you must always follow, please remember and pay close attention to this...

                Response format:
                {
                  "response": "Put what you want to say to the user here. They will always see this.",
                  "commands": [
                    {
                      "tool": "app.notify", // The name of the tool you want to invoke for them
                      "payload": {}, // The payload you want to send to the tool (pay attention to the tools schema above to understand the payloads)
                      "tip": "This is a tip you make for the user about what you're trying to acomplish with this tool for them. The user will be allowed to accept or reject each command based on this. Be concise. They will only see a few lines of text",
                    }
                  ]
                }

                Finally, here is the users most recent response, good luck and thank you for your service!

                User response:
                {{ user.lastResponse }}
              `,
            },
            "schema": {
              "type": "object",
              "properties": {
                "response": { "type": "string", "description": "The initial text to show the user" },
                "commands": { "type": "array", "description": "An array of commands that follow cli.tool" }
              },
              "required": ["model", "input"]
            }
          }
        },
        // Call any tool from a command line
        "cli": {
          "tool": {
            "description": "Run a tool from a Command Line Interface like this: 'tool provider.name param1 param2' i.e. 'tool replicate.stream deepseek-ai/deepseek-r1 What is the speed of an unladen swallow?'",
            "type": "request",
            "schema": {
              "type": "object",
              "properties": {
                "model": { "type": "string", "description": "The model you want to run" },
                "input": { "type": "object", "description": "The input the model needs" }
              },
              "required": ["model", "input"]
            }
          }
        },
        // Do anything on replicate.com
        "replicate": {
          "run": {
            "description": "Run anything on Replicate.com",
            "type": "request",
            "schema": {
              "type": "object",
              "properties": {
                "model": { "type": "string", "description": "The model you want to run" },
                "input": { "type": "object", "description": "The input the model needs" }
              },
              "required": ["model", "input"]
            }
          },
          "stream": {
            "description": "Stream anything on Replicate.com",
            "type": "stream",
            "schema": {
              "type": "object",
              "properties": {
                "model": { "type": "string", "description": "The model you want to stream" },
                "input": { "type": "object", "description": "The input the model needs" }
              },
              "required": ["model", "input"]
            }
          }
        },
        // Default provider
        "app": {
          "activation": {
            "description": "Run a tool from a Command Line Interface like this: 'tool provider.name param1 param2' i.e. 'tool replicate.stream deepseek-ai/deepseek-r1 What is the speed of an unladen swallow?'",
            "type": "request",
            "schema": {
              "type": "object",
              "properties": {
                "model": { "type": "string", "description": "The model you want to run" },
                "input": { "type": "object", "description": "The input the model needs" }
              },
              "required": ["model", "input"]
            }
          }
        },
      }
    }
  },
  "layout": {
    "menu": {
      "enabled": true,
      "meta": {
        "name": "layout.menu",
        "component": "AppMenu",
        "src": "src/layout/AppMenu.vue",
        "description": "A menu system that respects layouts",
        "documentation": "*Full markdown describing the feature goes here*",
        "image": "url"
      },
      "config": {
        "show": true,
        "tooltips": true,
        "tipdelay": 500,
        "width": 235,
        "miniWidth": 80,
        "logoHeight": 40,
        "position": "left",
        "title": true,
        "items": [
          {
            title: 'brand.platform.asset.plural',
            icon: 'tabler:photo-video',
            path: '/assets'
          },
          {
            title: 'brand.platform.content.plural',
            icon: 'tabler:photo-video',
            path: '/content'
          },
          {
            title: 'brand.platform.activation.plural',
            icon: 'tabler:device-ipad-horizontal-bolt',
            path: '/activations'
          },
          {
            title: 'brand.platform.production.plural',
            icon: 'tabler:video',
            path: '/productions'
          },
          {
            title: 'brand.platform.campaign.plural',
            icon: 'tabler:click',
            path: '/campaigns'
          },
          {
            title: 'Advertising',
            icon: 'tabler:ad-circle',
            path: '/advertising'
          },
          {
            title: 'brand.platform.analytics.plural',
            icon: 'tabler:clipboard-data',
            path: '/analytics'
          },
          {
            title: 'common.account',
            icon: 'tabler:user-circle',
            path: '/account'
          }
        ]
      }
    },
    "header": {
      "enabled": true,
      "meta": {
        "name": "layout.header",
        "component": "AppHeader",
        "src": "src/layout/AppHeader.vue",
        "description": "A header system that respects layouts",
        "documentation": "*Full markdown describing the feature goes here*",
        "image": "url"
      },
      "config": {
        "show": true,
        "tooltips": true,
        "tipdelay": 500,
        "logo": "https://example.com/logo.png",
        "title": true,
        "items": {
        }
      }
    },
    "footer": {
      "enabled": false,
      "meta": {
        "name": "layout.footer",
        "component": "AppFooter",
        "src": "src/layout/AppFooter.vue",
        "description": "A footer system that respects layouts",
        "documentation": "*Full markdown describing the feature goes here*",
        "image": "url"
      }
    }
  },
  "iframe": { // We have a feature we call "iframe" and it's turned on.
    "enabled": true,
    "meta": {  // The feature can (optionally) self-describe itself
      "name": "iframe embedding",
      "description": "Lets you embed the applicaiton in an iframe",
      "documentation": "*Full markdown describing the feature goes here*",
      "image": "url", // Image or animated GIF showing it's use
      "introduced": "1.0.1"
    },
    "noHeader": { // We have a feature we call "iframe.noheader" and it's turned on.
      "enabled": true,
      "meta": {
        "name": "No header",
        "description": "Disables the header through URL parameter (noHeader=1).",
        "documentation": "*Full markdown describing the feature goes here*",
        "image": "url"
      },
      "config": { // This feature has it's own configuration
        "allow": {
          "byUrl": true,
          "bySettings": false
        }
      }
    },
    "noFooter": {
      "enabled": true,
      "meta": {
        "name": "No Footer",
        "description": "Disables the footer through URL parameter (noFooter=1).",
        "documentation": "*Full markdown describing the feature goes here*",
        "image": "url",
      },
      "config": {
        "allow": {
          "byUrl": true,
          "bySettings": false
        }
      }
    },
    "noMenu": {
      "enabled": true,
      "meta": {
        "name": "No Menu",
        "description": "Disables the menu through URL parameter (noMenu=1).",
        "documentation": "*Full markdown describing the feature goes here*",
        "image": "url",
      },
      "config": {
        "allow": {
          "byUrl": true,
          "bySettings": false
        }
      }
    }
  },
  "dashboard": {
    "widgets": {
      "enabled": true,
      "meta": {
        "name": "Dashboard Widgets",
        "description": "Can be placed in the dashboard (or anywhere else in the app)",
        "NoteToJeff-ThisIsACustomMetaField-ItsFineBroh": "Wow I guess you proved me wrong, but at what cost?"
      },
      "config": {
        "draggable": true,
        "datasource_linking": true,
        "configurable_options": true
      }
    }
  },
  "activations": {
    "enabled": true,
    "meta": {
      "name": "Activations",
      "description": "Manage activations",
      "documentation": "Manage activations",
      "image": "url"
    },
    "config": {
      "environmentSettings": {
        "sizeTokens": {
          "xxs": 6,
          "xs": 10,
          "sm": 14,
          "md": 16,
          "lg": 20,
          "xl": 24,
          "xxl": 32
        },
        "overlay": {
          "defaultPadding": 16,
          "defaultOpacity": 0.8
        },
        "previews": {
          "default": {
            "template": [
              {
                "type": "text",
                "content": "{title}",
                "attributes": {
                  "font": "system",
                  "size": "lg",
                  "color": "#FFFFFF",
                  "weight": "bold",
                  "alignment": "left"
                }
              },
              {
                "type": "text",
                "content": "{subtitle}",
                "attributes": {
                  "font": "system",
                  "size": "md",
                  "color": "#CCCCCC",
                  "style": "italic",
                  "alignment": "left"
                }
              }
            ],
            "defaults": {
              "title": "Default Title",
              "subtitle": "Tap here to learn more",
              "showImage": true,
              "backgroundOpacity": 0.66,
              "backgroundColor": "#000000"
            }
          }
        }
      }
      ,
      "blockTypes": [
        {
          type: 'text',
          image: '/images/blocks/simple.gif',
          heading: 'Text',
          subheading: 'Simple text with basic formatting'
        },
        {
          type: 'rich',
          image: '/images/blocks/advanced.gif',
          heading: 'Rich Content',
          subheading: 'Rows, Columns, and more formatting capabilities'
        },
        {
          type: 'button',
          image: '/images/blocks/action.gif',
          heading: 'Call to action',
          subheading: 'Get your audience to do something specific'
        },
        {
          type: 'iframe',
          image: '/images/blocks/iframe.gif',
          heading: 'iFrame Content',
          subheading: 'iFrame any unrestricted web content',
          restrictions: ['AppleTV', 'Roku'],
          note: 'iFrames are not supported on all devices'
        },
      ],
      "wizard": {
        "steps": [
          {
            title: 'Template', subtitle: '', icon: 'tabler-users',
          },
          {
            title: 'Builder', subtitle: '', icon: 'tabler-home',
          },
          {
            title: 'Overview', subtitle: '', icon: 'tabler-home',
          },
          {
            title: 'Productions', subtitle: '', icon: 'tabler-bookmarks',
          },
          {
            title: 'Campaigns', subtitle: '', icon: 'tabler-map-pin',
          },
          {
            title: 'Settings', subtitle: '', icon: 'tabler-currency-dollar',
          },
        ]
      },
      "default": "all",
      "types": {
        "all": {
          "name": "All",
          "description": "All activations"
        },
        "active": {
          "name": "Active",
          "description": "Active activations"
        },
        "inactive": {
          "name": "Inactive",
          "description": "Inactive activations"
        }
      }
    }
  },
  "deviceSimulator" : {
    "enabled": true,
    "meta": {
      "name": "Device Emulator",
      "description": "Emulates a device in the browser",
      "documentation": "Emulate mobile devices, watches, TVs, game consoles, even remotes and controllers.",
      "image": "url"
    },
    "config": {
      "default": "web",
      "devices": {
        // Devices have a key name which should fully describe the devices color, name and orientation
        "web": {
          // The english version of the device
          "name": "Web Browser",
          // The type of device (mobile, tv, console, wearable, other)
          "type": "web",
          // The platform the device runs on (ios, android, tvos, playstation, xbox, nintendo, other)
          "platform": "web",
          // The screen dimensions within the image
          "screen": {
            "left": 0,
            "top": 0,
            "width": "100%",
            "height": "100%"
          },
          // The safe zone within the screen (where UI elements can safely be placed)
          "safeZone": {
            "top": 0,
            "right": 0,
            "bottom": 0,
            "left": 0
          },
          // Devices can have an underlay image (what appears behind the app)
          // You can also have an overlay image. The overlay goes on top of your app, like phone camera cutouts, rounded edge bleed overs, etc.
        },
        // Devices have a key name which should fully describe the devices color, name and orientation
        "iphone-6-portrait-white": {
          // The english version of the device
          "name": "iPhone 6 Portrait (white)",
          // The type of device (mobile, tv, console, wearable, other)
          "type": "mobile",
          // The platform the device runs on (ios, android, tvos, playstation, xbox, nintendo, other)
          "platform": "ios",
          // The screen dimensions within the image
          "screen": {
            "left": 34,
            "top": 126,
            "width": 414,
            "height": 736
          },
          // The safe zone within the screen (where UI elements can safely be placed)
          "safeZone": {
            "top": 0,
            "right": 0,
            "bottom": 0,
            "left": 0
          },
          // Devices can have an underlay image (what appears behind the app)
          "underlay": {
            // The path within the emulator folder
            "filepath": "/images/device-mocks/iphone-6-portrait-white.png",
            // The size of the image
            "imageDimensions": [482, 982],
            // The position of the underlay image can be altered if you need it
            "position": {
              "left": 0,
              "top": 0
            }
          }
          // You can also have an overlay image. The overlay goes on top of your app, like phone camera cutouts, rounded edge bleed overs, etc.
        },
        "iphone-15-portrait-black": {
          "name": "iPhone 15 Portrait (black)",
          "type": "mobile",
          "platform": "ios",
          "screen": {
            "left": 200,
            "top": 45,
            "width": 684,
            "height": 1481
          },
          "safeZone": {
            "top": 50,
            "right": 0,
            "bottom": 0,
            "left": 0
          },
          "overlay": {
            "filepath": "/images/device-mocks/iphone-15-portrait-black.png",
            "imageDimensions": [1076, 1628],
            "position": {
              "left": 0,
              "top": 0
            }
          }
        },
        "iphone-14-landscape-black": {
          "name": "iPhone 14 Landscape (black)",
          "type": "mobile",
          "platform": "ios",
          "screen": {
            "left": 41,
            "top": 47,
            "width": 1918,
            "height": 885
          },
          "safeZone": {
            "top": 0,
            "right": 0,
            "bottom": 0,
            "left": 35
          },
          "overlay": {
            "filepath": "/images/device-mocks/iphone-14-landscape-black-border.png",
            "imageDimensions": [2000, 979],
            "position": {
              "left": 0,
              "top": 0
            }
          }
        },
        "google-pixel-portrait-blue": {
          "name": "Google Pixel Portrait (blue)",
          "type": "mobile",
          "platform": "android",
          "screen": {
            "left": 27,
            "top": 109,
            "width": 411,
            "height": 731
          },
          "safeZone": {
            "top": 30,
            "right": 0,
            "bottom": 0,
            "left": 0
          },
          "underlay": {
            "filepath": "/images/device-mocks/google-pixel-portrait-blue.png",
            "imageDimensions": [470, 964],
            "position": {
              "left": 0,
              "top": 0
            }
          }
        },
        "apple-tv-55-6ft": {
          "name": "Apple TV 55\" (6 feet away)",
          "type": "tv",
          "platform": "tvos",
          "screen": {
            "left": 420,
            "top": 252,
            "width": 1163,
            "height": 654
          },
          "safeZone": {
            "top": 0,
            "right": 0,
            "bottom": 0,
            "left": 0
          },
          "underlay": {
            "filepath": "/images/device-mocks/apple-tv-55-6ft.png",
            "imageDimensions": [2000, 1400],
            "position": {
              "left": 0,
              "top": 0
            }
          },
          // The emulator can have a remote control/controller
          "remote": {
            // The image path to the remote
            "filepath": "/images/device-mocks/apple-tv-remote.png",
            // The domensions of the remote
            "imageDimensions": [300, 920],
            // The buttons on the remote, relative to the image, and if there are any rounded corners
            "buttons": {
              // Add anything you want, but default supported are "power", "tv", "back", "play_pause", "mute", "up", "down", "left", "right", "select", "volume_up", "volume_down"
              "power": { "top": 27, "left": 197.5, "width": 43, "height": 43, "radius": 22 },
              "tv": { "top": 305.5, "left": 156.5, "width": 85, "height": 85, "radius": 45 },
              "back": { "top": 305.5, "left": 55.5, "width": 85, "height": 85, "radius": 45 },
              "play_pause": { "top": 404.5, "left": 55.5, "width": 85, "height": 85, "radius": 45 },
              "mute": { "top": 504.5, "left": 55.5, "width": 85, "height": 85, "radius": 45 },
              "up": { "top": 87, "left": 105, "width": 90, "height": 47, "radius": 20 },
              "down": { "top": 252, "left": 105, "width": 90, "height": 47, "radius": 20 },
              "left": { "top": 150, "left": 42, "width": 47, "height": 90, "radius": 20 },
              "right": { "top": 148, "left": 208, "width": 47, "height": 90, "radius": 20 },
              "select": { "top": 133, "left": 89, "width": 119, "height": 119, "radius": 60 },
              "volume_up": { "top": 404.5, "left": 156.5, "width": 85, "height": 85, "radius": 45 },
              "volume_down": { "top": 504.5, "left": 156.5, "width": 85, "height": 85, "radius": 45 }
            }
          }
        },
        "apple-tv-55-3ft": {
          "name": "Apple TV 55\" (3 feet away)",
          "type": "tv",
          "platform": "tvos",
          "screen": {
            "left": 112,
            "top": 105,
            "width": 1792,
            "height": 1000
          },
          "safeZone": {
            "top": 0,
            "right": 0,
            "bottom": 0,
            "left": 0
          },
          "underlay": {
            "filepath": "/images/device-mocks/apple-tv-55-3ft.png",
            "imageDimensions": [2000, 1400],
            "position": {
              "left": 0,
              "top": 0
            }
          },
          "remote": {
            "filepath": "/images/device-mocks/apple-tv-remote.png",
            "imageDimensions": [300, 920],
            "buttons": {
              "power": { "top": 27, "left": 197.5, "width": 43, "height": 43, "radius": 22 },
              "tv": { "top": 305.5, "left": 156.5, "width": 85, "height": 85, "radius": 45 },
              "back": { "top": 305.5, "left": 55.5, "width": 85, "height": 85, "radius": 45 },
              "play_pause": { "top": 404.5, "left": 55.5, "width": 85, "height": 85, "radius": 45 },
              "mute": { "top": 504.5, "left": 55.5, "width": 85, "height": 85, "radius": 45 },
              "up": { "top": 87, "left": 105, "width": 90, "height": 47, "radius": 20 },
              "down": { "top": 252, "left": 105, "width": 90, "height": 47, "radius": 20 },
              "left": { "top": 150, "left": 42, "width": 47, "height": 90, "radius": 20 },
              "right": { "top": 148, "left": 208, "width": 47, "height": 90, "radius": 20 },
              "select": { "top": 133, "left": 89, "width": 119, "height": 119, "radius": 60 },
              "volume_up": { "top": 404.5, "left": 156.5, "width": 85, "height": 85, "radius": 45 },
              "volume_down": { "top": 504.5, "left": 156.5, "width": 85, "height": 85, "radius": 45 }
            }
          }
        }
      }

    }
  },
  "organization": {
    "enabled": true,
    "meta": {
      "name": "Organization",
      "description": "Manage your organization",
      "documentation": "Manage your organization",
      "image": "url"
    },
    "config": {
      "defaultSettings": {
        "foo": "bar"
      }
    }
  },
}

export default settings;
