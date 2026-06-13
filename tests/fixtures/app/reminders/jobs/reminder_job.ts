export default class ReminderJob {
    plugins: any[] = []

    async perform(_message: string) {}

    async enqueue(_message: string) {}
}
