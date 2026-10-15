package br.com.connectas.orientador.cost;

import br.com.connectas.orientador.security.SessionPrincipal;
import br.com.connectas.orientador.account.AccountService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/costs")
public class CostController {
    private final CostService costs;
    private final ExchangeRateService rates;
    private final AccountService accounts;
    public CostController(CostService costs, ExchangeRateService rates, AccountService accounts) { this.costs = costs; this.rates = rates; this.accounts = accounts; }
    @GetMapping
    CostService.Report report(Authentication auth, @RequestParam(defaultValue = "WEEK") String period, @RequestParam(defaultValue = "0") int page) {
        var user = ((SessionPrincipal) auth.getPrincipal()).userId();
        accounts.currentIdentity(user);
        return costs.report(user, period, page, rates.current());
    }
}
