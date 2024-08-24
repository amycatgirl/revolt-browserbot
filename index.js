import { Client } from "revolt.js"
import { PuppeteerController } from "./browser/index.js"
import { AutumnService } from "./lib/autumn/index.js"

const client = new Client()
const browserManager = new PuppeteerController()

const PREFIX = "nav?"

client.once('ready', () => console.log("Ready!"))

client.on('messageCreate', async (message) => {
	if (message.author.bot || !message.server || message.author.id === client.user.id || !message.content || !message.content.startsWith(PREFIX)) return

	const args = message.content.slice(PREFIX.length).trim().split(/ +/g)
	const command = args.shift()


	try {
		if (command === "createInstanceDebug") {
			const instance = await browserManager.createInstance(message.server.id)

			console.log(instance)
		} else if (command === "navigateDebug") {
			const instance = browserManager.getInstance(message.server.id)

			const tab = await instance.newTab(message.author.id)

			await tab.navigateTo("https://google.com")

			const screenie = await tab.takeScreenshot()

			const fileId = await AutumnService.uploadFile("attachments", screenie)

			message.reply({ attachments: [fileId] })
		} else if (command === "goto") {
			const instance = browserManager.getInstance(message.server.id)
			const tab = instance.getTab(message.author.id) ?? await instance.newTab(message.author.id)

			await tab.navigateTo(args[0])

			const screenie = await tab.takeScreenshot()

			const fileId = await AutumnService.uploadFile("attachments", screenie)

			await message.reply({ content: "Navigated to " + args[0], attachments: [fileId] })
		} else if (command === "listtabs") {
			const instance = browserManager.getInstance(message.server.id)

			const tabs = instance.tabs.filter(
				tab => tab.owner === message.author.id
			)

			console.log(tabs)


			let formatedTable = "|tab owner|title|\n|---|---|\n"

			for (const tab of tabs) {
				const title = await tab._page.evaluate(() => document.title)
				formatedTable += `|${tab.owner}|${title}|\n`
			}

			message.reply(formatedTable)
		} else if (command === "click") {
			if (!args[0]) {
				await message.reply("Command requires 1 argument to be passed.")
				return
			}

			const instance = browserManager.getInstance(message.server.id)
			const tab = instance.getTab(message.author.id)

			// TODO make clickElement func 
			const element = await tab._page.$(args[0])

			if (!element) {
				await message.reply(`Could not find element with text: ${args[0]}`)
				return
			}
			
			await Promise.all([
				tab._page.waitForSelector('html'),
				element.click()
			])

			const screenie = await tab.takeScreenshot()

			const fileId = await AutumnService.uploadFile("attachments", screenie)

			message.reply({
				attachments: [ fileId ]
			})
		} else if (command === "write") {
			if (!args[0] || !args[1]) {
				await message.reply("Command requires 2 arguments to be passed.")
				return
			}

			const instance = browserManager.getInstance(message.server.id)
			const tab = instance.getTab(message.author.id)

			// TODO make clickElement func 
			const element = await tab._page.$(args[0])

			await element.type(args[1])

			const screenie = await tab.takeScreenshot()

			const fileId = await AutumnService.uploadFile("attachments", screenie)

			message.reply({
				attachments: [ fileId ]
			})
		} else if (command === "printScreen") {
			const instance = browserManager.getInstance(message.server.id)
			const tab = instance.getTab(message.author.id)
			
			const screenie = await tab.takeScreenshot()

			const fileId = await AutumnService.uploadFile("attachments", screenie)

			message.reply({
				attachments: [ fileId ]
			})

		} else {
			message.reply("Invalid command")
		}
	} catch (error) {
		message.reply("Hey! An exception was thrown. Check the console to learn more.")
		console.error(error)
	}
})


client.loginBot(process.env.TOKEN)
