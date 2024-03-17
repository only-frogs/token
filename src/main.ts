import { Keypair, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { generateSigner, createSignerFromKeypair } from "@metaplex-foundation/umi";
import { createAndMint } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import fs from 'fs';

// Read configuration
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync('./src/utils/config.json', 'utf-8'));

// Connect to Solana network
const solanaConnection = new Connection(config.SOLANA_API_URL);

// Generate wallet
async function generateWallet() {
    const keypair = Keypair.generate();
    console.log(`Generated new KeyPair. Wallet PublicKey: `, keypair.publicKey.toString());
    return keypair;
}

// Request airdrop
async function requestAirdrop(publicKey: any) {
    try {
        const airdropSignature = await solanaConnection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
        const txId = await solanaConnection.confirmTransaction(airdropSignature);
        console.log(`Airdrop successful. Transaction ID: ${txId}`);
    } catch (error) {
        console.error("Error requesting airdrop:", error);
    }
}

// Write secret key to file
async function writeSecretKeyToFile(secretKey: any) {
    try {
        fs.writeFileSync(config.SECRET_KEY_FILE, JSON.stringify(secretKey));
        console.log(`Secret key successfully written to ${config.SECRET_KEY_FILE}`);
    } catch (error) {
        console.error("Error writing secret key to file:", error);
    }
}

// Log error to file
async function logErrorToFile(error: any) {
    try {
        fs.appendFileSync(config.LOG_FILE, error.toString());
        console.log(`Error logged to ${config.LOG_FILE}`);
    } catch (error) {
        console.error("Error logging error to file:", error);
    }
}

// Initialize Umi
async function initializeUmi() {
    const umi = await createUmi({
        connection: solanaConnection,
        signers: [],
    });
    return umi;
}

// Generate token metadata
function generateTokenMetadata() {
    return {
        name: config.TOKEN_NAME,
        symbol: config.TOKEN_SYMBOL,
        seller_fee_basis_points: 0,
        creators: [],
        royalties: [],
        uri: config.WEBSITE_URL,
        files: [
            {
                uri: 'https://ipfs.io/ipfs/QmPB8JfsYJ1Buf9pd3BDiHyiFmZBGy1mJ5FyuQHUzX7XaQ?filename=gold-digger.png',
                type: 'image/png',
            },
        ],
    };
}

// Mint tokens
async function mintTokens() {
    try {
        console.info("Starting token minting process...");
        
        // Generate wallet
        const walletKeyPair = await generateWallet();

        // Request airdrop
        await requestAirdrop(walletKeyPair.publicKey);

        // Write secret key to file
        await writeSecretKeyToFile(walletKeyPair.secretKey);

        // Initialize Umi
        const umi = await initializeUmi();

        // Create mint signer
        const mintSigner = generateSigner(umi);

        // Calculate amount to mint
        const amountToMint = 10; // Example: Set the amount to mint

        // Generate token metadata
        const metadata = generateTokenMetadata();

        // Mint tokens
        const mintTx = await createAndMint(umi, {
            mint: mintSigner,
            authority: mintSigner.publicKey,
            metadata: metadata,
            decimals: config.DECIMALS,
            amount: amountToMint.toString(),
            tokenOwner: walletKeyPair.publicKey,
            tokenStandard: TOKEN_2022_PROGRAM_ID,
        }).sendAndConfirm(umi);

        console.info(`Successfully minted ${amountToMint} ${config.TOKEN_SYMBOL} tokens`);
        console.info("Transaction:", mintTx);
    } catch (error) {
        console.error(`An error occurred during token minting: ${error}`);
        await logErrorToFile(error);
    }
}

// Mint tokens
mintTokens();
