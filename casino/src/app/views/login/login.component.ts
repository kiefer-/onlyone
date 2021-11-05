import { Location } from "@angular/common";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { __core_private_testing_placeholder__ } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from "src/environments/environment";
import Web3 from "web3";
import { AuthGuardService } from "../../services/auth/auth-guard.service";
import { LoadingService } from "../../services/loading/loading.service";

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: [ './login.component.css' ]
})
export class LoginComponent implements OnInit {
    constructor(
        private auth: AuthGuardService,
        private route: ActivatedRoute,
        private location: Location,
        private http: HttpClient,
        private router: Router,
        private loading: LoadingService,
    ){
    }

    async ngOnInit( ) {
    }

    async login() {
        this.loading.isLoading.next(true);
        if (typeof (window as any).ethereum !== 'undefined') {
        this.auth.web3 = new Web3(Web3.givenProvider);
        console.log('Web3 wallet is installed!');
        } else {
            // add message and hide connect button.
            console.error("Please install an web3 wallet in order to use the site.");
            return;
        }
        const ethereum: any = (window as any).ethereum;
        if (!environment.production) {
            (window as any).web3 = this.auth.web3;
        }

        try {
            await ethereum.request({ method: 'wallet_addEthereumChain', 
                    params: [{ chainId: '0x38', 
                                chainName: 'Binance Smart Chain',
                                nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, 
                                rpcUrls: ['https://bsc-dataseed.binance.org/'], 
                                blockExplorerUrls: ['https://bscscan.com/'] 
                            }] 
            });
            const accounts = await this.auth.web3.eth.requestAccounts(); //ethereum.request({ method: 'eth_requestAccounts' });
            const account = this.auth.web3.utils.toChecksumAddress(accounts[0]);
            const balance = await this.auth.web3.eth.getBalance(account);
            this.auth.web3AccountBalance = Number(balance)/1e18;
            this.auth.wallet = account;
            // this.balance = web3.utils.fromWei(balance) + " BNB";

            let headers: any = {
                WALLET: account,
            }
            const signMessageObj = await this.http.get<any>(
                "/services/getSignMessage",
                { headers: new HttpHeaders(headers) }).toPromise()
            const signMessage = signMessageObj.data;
            const signature = await this.auth.web3.eth.personal.sign(signMessage, account, "");
            // TODO Check the signature with the DB. If the signature match with the DB - log in the user.

            // here we send the signature and account to the backend and if the account exists
            // then show the casino balance.
            // if no - add account and signature to the DB,
            // associate newly created wallet to the account
            // when the user deposit - get the money from the created account
            // when they arrive - transfer them to the casino account and refresh the user's balance with the new money
            // Withdraw sends from the casino account to the user wallet. Withdraw tax - 2 times transaction tax (Cover the deposit)

            console.log(signature);
            headers['SIGNATURE'] = signature;

            const response = await this.http.get<any>("/services/hello",
                { headers: new HttpHeaders(headers) }).toPromise();

            // TODO Set Cookie in the response.
            console.log(response.data);
            const respData = response.data.split(':');
            this.auth.depositAddress = respData[0];
            this.auth.balance = respData[1];
            this.auth.token = respData[2];
        } catch (e: any) {
            console.error(e);
        }
        this.loading.isLoading.next(false);
        this.router.navigate(['']);
    }
}