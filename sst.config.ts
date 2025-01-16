/// <reference path="./.sst/platform/config.d.ts" />
// As of 01/15/2025, "npx sst ..." commands must be used with WSL since there isn't Windows support

export default $config({
    app(input) {
        return {
            name: 'portfolio',
            home: 'aws',
            removal: input.stage === 'production' ? 'retain' : 'remove',
            providers: {
                aws: {
                    // sst deploy --stage [production|dev]
                    profile: input.stage === 'production' ? 'portfolio-production' : 'portfolio-dev',
                    region: 'us-west-2'
                }
            }
        };
    },
    async run() {
        const vpc = new sst.aws.Vpc('PortfolioVPC');
        const cluster = new sst.aws.Cluster('PortfolioCluster', { vpc });
    
        cluster.addService('PortfolioService', {
            loadBalancer: {
                domain: {
                    name: 'nijordan.dev',
                    aliases: ['*.nijordan.dev']
                },
                rules: [
                    { listen: '80/http', redirect: '443/https' },
                    { listen: '443/https', forward: '3000/http' }
                ]
            },
            dev: {
                command: 'npm run start'
            }
        });
    }
});