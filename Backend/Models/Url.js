import mongoose from 'mongoose'

const historySchema = new mongoose.Schema({
    ip: { type: String, required: true },
    count: { type: Number, default: 1 }
});

const urlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortUrl: { type: String, required: true, unique: true, minlength: 3, maxlength: 20, match: /^[A-Za-z0-9_-]+$/ },
    createdAt: { type: Date, default: Date.now },
    history: [historySchema]
});

urlSchema.methods.incrementIpCount = function(ip) {
    const entry = this.history.find(h => h.ip === ip);
    if (entry) {
        entry.count += 1;
    } else {
        this.history.push({ ip, count: 1 });
    }
    return this.save();
};


const UrlModel = mongoose.model("UrlData",urlSchema)
export default UrlModel