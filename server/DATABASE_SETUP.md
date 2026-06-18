# Umusare Database Setup

Umusare uses MongoDB Atlas through Mongoose.

The real MongoDB connection string belongs only in `server/.env`:

```env
DATABASE_URL=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/umusare?appName=Cluster0
```

Do not put real usernames, passwords, or Atlas URLs in frontend files, browser-visible files, README examples, or `.env.example`.

## Test The Connection

From the `server/` folder:

```powershell
npm.cmd run test:db
```

Success looks like:

```text
DATABASE_URL present: yes
JWT_SECRET present: yes
DATABASE_URL type: mongodb+srv
MongoDB host: cluster-name.mongodb.net
DNS override enabled: yes
MongoDB test connection: success
```

The script does not create users and does not modify database data.

## Seed Admin After DB Test Passes

Only after `test:db` succeeds:

```powershell
npm.cmd run seed:admin
```

Then start the backend:

```powershell
npm.cmd run dev
```

## Troubleshooting `querySrv ECONNREFUSED`

If a seed or connection test fails with:

```text
querySrv ECONNREFUSED
```

try:

- confirm MongoDB Atlas IP Access List allows the current IP, or temporarily `0.0.0.0/0` for development
- set `DNS_SERVERS=8.8.8.8,1.1.1.1` in `server/.env` so Node uses public DNS resolvers for the SRV lookup
- wait for the Atlas cluster/deployment to finish
- test DNS with `nslookup -type=SRV _mongodb._tcp.YOUR_CLUSTER.mongodb.net`
- test port `27017` with `Test-NetConnection`
- try another network or phone hotspot if the internet provider blocks MongoDB SRV/DNS lookups
- copy the Atlas "Drivers" connection string exactly
- if SRV keeps failing, use the non-SRV standard MongoDB connection string from Atlas if Atlas provides one

Do not invent a non-SRV URL manually. Use the exact string from Atlas.
